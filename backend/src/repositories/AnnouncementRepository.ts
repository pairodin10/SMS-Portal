import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { dbPool } from '../config/database';

export interface Announcement {
  id: number;
  title: string;
  body: string;
  status: number;
  createdAt: string;
  createdBy: number;
  modifiedAt: string | null;
  modifiedBy: number | null;
}

export type CreateAnnouncementInput = Pick<Announcement, 'title' | 'body' | 'status'>;
export type UpdateAnnouncementInput = Partial<CreateAnnouncementInput>;

interface AnnouncementRow extends RowDataPacket {
  id: number;
  title: string;
  body: string;
  status: number;
  created: Date | string;
  created_by: number;
  modified: Date | string | null;
  modified_by: number | null;
}

const selectFields = 'id, title, body, status, created, created_by, modified, modified_by';

export class AnnouncementRepository {
  async findLatest(): Promise<Announcement | null> {
    const [rows] = await dbPool.query<AnnouncementRow[]>(
      `SELECT ${selectFields}
       FROM announcement
       ORDER BY created DESC, id DESC
       LIMIT 1`,
    );
    const row = rows[0];
    return row ? this.toAnnouncement(row) : null;
  }

  async findAll(): Promise<Announcement[]> {
    const [rows] = await dbPool.query<AnnouncementRow[]>(
      `SELECT ${selectFields} FROM announcement ORDER BY created DESC, id DESC`,
    );
    return rows.map((row) => this.toAnnouncement(row));
  }

  async findById(id: number): Promise<Announcement | null> {
    const [rows] = await dbPool.execute<AnnouncementRow[]>(
      `SELECT ${selectFields} FROM announcement WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? this.toAnnouncement(rows[0]) : null;
  }

  async create(input: CreateAnnouncementInput, actorId: number): Promise<Announcement> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO announcement (title, body, status, created_by)
       VALUES (?, ?, ?, ?)`,
      [input.title, input.body, input.status, actorId],
    );
    const announcement = await this.findById(result.insertId);
    if (!announcement) throw new Error('Announcement was created but could not be retrieved.');
    return announcement;
  }

  async update(id: number, input: UpdateAnnouncementInput, actorId: number): Promise<Announcement | null> {
    const columns: Record<keyof UpdateAnnouncementInput, string> = {
      title: 'title',
      body: 'body',
      status: 'status',
    };
    const fields: string[] = [];
    const values: Array<string | number> = [];

    for (const key of Object.keys(columns) as Array<keyof UpdateAnnouncementInput>) {
      const value = input[key];
      if (value !== undefined) {
        fields.push(`${columns[key]} = ?`);
        values.push(value);
      }
    }

    fields.push('modified = CURRENT_TIMESTAMP', 'modified_by = ?');
    values.push(actorId, id);
    await dbPool.execute<ResultSetHeader>(
      `UPDATE announcement SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      'DELETE FROM announcement WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  }

  async deleteMany(ids: number[]): Promise<number> {
    const placeholders = ids.map(() => '?').join(', ');
    const [result] = await dbPool.execute<ResultSetHeader>(
      `DELETE FROM announcement WHERE id IN (${placeholders})`,
      ids,
    );
    return result.affectedRows;
  }

  private toAnnouncement(row: AnnouncementRow): Announcement {
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      status: row.status,
      createdAt: this.toDateString(row.created),
      createdBy: row.created_by,
      modifiedAt: row.modified ? this.toDateString(row.modified) : null,
      modifiedBy: row.modified_by,
    };
  }

  private toDateString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : value;
  }
}
