import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { dbPool } from '../config/database';

export type SmsServerStatus = 'active' | 'disabled';

export interface SmsServer {
  id: string;
  name: string;
  type: string;
  url: string;
  status: SmsServerStatus;
  priority: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

interface SmsServerRow extends RowDataPacket {
  id: string;
  server_name: string;
  server_url: string;
  server_type: string;
  status: SmsServerStatus;
  priority: number;
  success_rate: number | string | null;
  created_at: Date;
  updated_at: Date;
}

export class SmsServerRepository {
  async findAll(): Promise<SmsServer[]> {
    const [rows] = await dbPool.query<SmsServerRow[]>(
      `SELECT id, server_name, server_url, server_type, status, priority,
              success_rate, created_at, updated_at
       FROM sms_servers ORDER BY priority ASC, created_at DESC`,
    );
    return rows.map((row) => this.toSmsServer(row));
  }

  async create(data: {
    id: string;
    name: string;
    url: string;
    type: string;
    status: SmsServerStatus;
    priority: number;
  }): Promise<SmsServer> {
    await dbPool.execute<ResultSetHeader>(
      `INSERT INTO sms_servers (id, server_name, server_url, server_type, status, priority)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.id, data.name, data.url, data.type, data.status, data.priority],
    );
    const server = await this.findById(data.id);
    if (!server) {
      throw new Error('SMS server was created but could not be retrieved.');
    }
    return server;
  }

  async findById(id: string): Promise<SmsServer | null> {
    const [rows] = await dbPool.execute<SmsServerRow[]>(
      `SELECT id, server_name, server_url, server_type, status, priority,
              success_rate, created_at, updated_at
       FROM sms_servers WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? this.toSmsServer(rows[0]) : null;
  }

  async update(
    id: string,
    data: Partial<Pick<SmsServer, 'name' | 'url' | 'type' | 'status' | 'priority'>>,
  ): Promise<SmsServer | null> {
    const fields: string[] = [];
    const values: Array<string | number> = [];

    if (data.name !== undefined) {
      fields.push('server_name = ?');
      values.push(data.name);
    }
    if (data.url !== undefined) {
      fields.push('server_url = ?');
      values.push(data.url);
    }
    if (data.type !== undefined) {
      fields.push('server_type = ?');
      values.push(data.type);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.priority !== undefined) {
      fields.push('priority = ?');
      values.push(data.priority);
    }
    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await dbPool.execute<ResultSetHeader>(
      `UPDATE sms_servers SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      'DELETE FROM sms_servers WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  }

  private toSmsServer(row: SmsServerRow): SmsServer {
    return {
      id: row.id,
      name: row.server_name,
      url: row.server_url,
      type: row.server_type,
      status: row.status,
      priority: row.priority,
      successRate: Number(row.success_rate ?? 0),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
