import { randomBytes } from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { dbPool } from '../config/database';
import { User } from '../models/User';
import { IRepository } from '../interfaces/IRepository';

export interface IUserRepository extends IRepository<User> {
  deleteMany(ids: string[]): Promise<number>;
  findByEmail(email: string): Promise<User | null>;
  findByIdentifier(identifier: string): Promise<User | null>;
  isEmailInUse(email: string, exceptId?: string): Promise<boolean>;
  isUsernameInUse(username: string, exceptId?: string): Promise<boolean>;
}

interface UserRow extends RowDataPacket {
  id: number;
  full_name: string | null;
  email: string;
  username: string;
  password: string;
  role: string;
  status: number;
  created: Date | null;
  sms_credits: number | string | null;
  whatsapp_credits: number | string | null;
  checker_credits: number | string | null;
  voice_credits: number | string | null;
  email_credits: number | string | null;
  chat_id: string | null;
  telegram_username: string | null;
}

const userSelectFields = `id, full_name, email, username, password, role, status, created,
  sms_credits, whatsapp_credits, checker_credits, voice_credits, email_credits,
  chat_id, telegram_username`;

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const [rows] = await dbPool.execute<UserRow[]>(
      `SELECT ${userSelectFields}
       FROM users WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? this.toUser(rows[0]) : null;
  }

  async findAll(): Promise<User[]> {
    const [rows] = await dbPool.query<UserRow[]>(
      `SELECT ${userSelectFields}
       FROM users ORDER BY id DESC`,
    );
    return rows.map((row) => this.toUser(row));
  }

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await dbPool.execute<UserRow[]>(
      `SELECT ${userSelectFields}
       FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
      [email],
    );
    return rows[0] ? this.toUser(rows[0]) : null;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const [rows] = await dbPool.execute<UserRow[]>(
      `SELECT ${userSelectFields}
       FROM users
       WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
       LIMIT 1`,
      [identifier, identifier],
    );
    return rows[0] ? this.toUser(rows[0]) : null;
  }

  async isEmailInUse(email: string, exceptId?: string): Promise<boolean> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT id FROM users
       WHERE LOWER(email) = LOWER(?) AND (? IS NULL OR id <> ?)
       LIMIT 1`,
      [email, exceptId ?? null, exceptId ?? null],
    );
    return rows.length > 0;
  }

  async isUsernameInUse(username: string, exceptId?: string): Promise<boolean> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT id FROM users
       WHERE LOWER(username) = LOWER(?) AND (? IS NULL OR id <> ?)
       LIMIT 1`,
      [username, exceptId ?? null, exceptId ?? null],
    );
    return rows.length > 0;
  }

  async create(data: Partial<User>): Promise<User> {
    const email = data.email ?? 'user@example.com';
    const username = data.username
      ?? `${email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40) || 'user'}_${randomBytes(3).toString('hex')}`;
    const role = this.toDatabaseRole(data.role ?? 'viewer');
    const status = data.status === 'active' ? 1 : 0;
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO users (full_name, email, username, password, role, status, chat_id, telegram_username)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.fullName ?? 'System User',
        email,
        username,
        data.passwordHash ?? '',
        role,
        status,
        data.chatId ?? null,
        data.telegramUsername ?? null,
      ],
    );

    const createdUser = await this.findById(String(result.insertId));
    if (!createdUser) {
      throw new Error('User was created but could not be retrieved.');
    }
    return createdUser;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: Array<string | number> = [];

    if (data.fullName !== undefined) {
      fields.push('full_name = ?');
      values.push(data.fullName);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.username !== undefined) {
      fields.push('username = ?');
      values.push(data.username);
    }
    if (data.passwordHash !== undefined) {
      fields.push('password = ?');
      values.push(data.passwordHash);
    }
    if (data.role !== undefined) {
      fields.push('role = ?');
      values.push(this.toDatabaseRole(data.role));
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status === 'active' ? 1 : 0);
    }
    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await dbPool.execute<ResultSetHeader>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  }

  async deleteMany(ids: string[]): Promise<number> {
    const placeholders = ids.map(() => '?').join(', ');
    const [result] = await dbPool.execute<ResultSetHeader>(
      `DELETE FROM users WHERE id IN (${placeholders})`,
      ids,
    );
    return result.affectedRows;
  }

  private toUser(row: UserRow): User {
    const role = this.toApplicationRole(row.role);
    return new User(
      String(row.id),
      row.full_name?.trim() || row.username,
      row.email,
      row.password,
      role,
      row.status === 1 ? 'active' : 'inactive',
      row.created ?? new Date(),
      row.username,
      {
        sms: Number(row.sms_credits ?? 0),
        whatsapp: Number(row.whatsapp_credits ?? 0),
        checker: Number(row.checker_credits ?? 0),
        voice: Number(row.voice_credits ?? 0),
        email: Number(row.email_credits ?? 0),
      },
      row.chat_id,
      row.telegram_username,
    );
  }

  private toApplicationRole(role: string): string {
    switch (role.toLowerCase()) {
      case 'administrator':
      case 'admin':
        return 'administrator';
      case 'super_admin':
      case 'super admin':
        return 'super_admin';
      case 'operator':
        return 'operator';
      case 'user':
      case 'viewer':
      case 'reseller':
      default:
        return 'viewer';
    }
  }

  private toDatabaseRole(role: string): string {
    switch (role.toLowerCase()) {
      case 'administrator':
      case 'admin':
        return 'Administrator';
      case 'reseller':
        return 'Reseller';
      default:
        return 'User';
    }
  }
}
