import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { dbPool } from '../config/database';

export type ApiClientStatus = 'active' | 'disabled';

export interface ApiClient {
  id: number;
  userId: number;
  user: string;
  type: number;
  status: ApiClientStatus;
  createdAt: string;
  createdBy: number;
  modifiedAt: string | null;
  modifiedBy: number | null;
}

interface ApiClientRow extends RowDataPacket {
  id: number;
  user_id: number;
  username: string;
  type: number;
  status: number;
  created: Date | string;
  created_by: number;
  modified: Date | string | null;
  modified_by: number | null;
}

const selectFields = `id, user_id, \`user\` AS username, type, status,
  created, created_by, modified, modified_by`;

export class ApiClientRepository {
  async findAll(): Promise<ApiClient[]> {
    const [rows] = await dbPool.query<ApiClientRow[]>(
      `SELECT ${selectFields} FROM api_client ORDER BY created DESC, id DESC`,
    );
    return rows.map((row) => this.toApiClient(row));
  }

  async create(data: {
    userId: number;
    user: string;
    type: number;
    apiKey: string;
    status: number;
    actorId: number;
  }): Promise<ApiClient> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO api_client (user_id, \`user\`, type, api_key, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.userId, data.user, data.type, data.apiKey, data.status, data.actorId],
    );
    const client = await this.findById(result.insertId);
    if (!client) {
      throw new Error('API client was created but could not be retrieved.');
    }
    return client;
  }

  async findById(id: number): Promise<ApiClient | null> {
    const [rows] = await dbPool.execute<ApiClientRow[]>(
      `SELECT ${selectFields} FROM api_client WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? this.toApiClient(rows[0]) : null;
  }

  async update(id: number, status: number, actorId: number): Promise<ApiClient | null> {
    await dbPool.execute<ResultSetHeader>(
      'UPDATE api_client SET status = ?, modified = CURRENT_TIMESTAMP, modified_by = ? WHERE id = ?',
      [status, actorId, id],
    );
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      'DELETE FROM api_client WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  }

  async deleteMany(ids: number[]): Promise<number> {
    const placeholders = ids.map(() => '?').join(', ');
    const [result] = await dbPool.execute<ResultSetHeader>(
      `DELETE FROM api_client WHERE id IN (${placeholders})`,
      ids,
    );
    return result.affectedRows;
  }

  private toApiClient(row: ApiClientRow): ApiClient {
    return {
      id: row.id,
      userId: row.user_id,
      user: row.username,
      type: row.type,
      status: row.status === 1 ? 'active' : 'disabled',
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
