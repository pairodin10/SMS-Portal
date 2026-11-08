import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { dbPool } from '../config/database';

export interface VoiceServer {
  id: number;
  name: string;
  phoneNumber: string;
  status: number;
  created: string;
  createdBy: number;
  modified: string | null;
  modifiedBy: number | null;
}

interface VoiceServerRow extends RowDataPacket {
  id: number;
  name: string;
  phone_number: string;
  status: number;
  created: Date | string;
  created_by: number;
  modified: Date | string | null;
  modified_by: number | null;
}

export type VoiceServerWriteFields = {
  name: string;
  sid: string;
  token: string;
  phoneNumber: string;
  status: number;
};

const selectFields = 'id, name, phone_number, status, created, created_by, modified, modified_by';

export class VoiceServerRepository {
  async findAll(): Promise<VoiceServer[]> {
    const [rows] = await dbPool.query<VoiceServerRow[]>(`
      SELECT ${selectFields}
      FROM voice_api
      ORDER BY id DESC
    `);

    return rows.map((row) => this.toVoiceServer(row));
  }

  async findById(id: number): Promise<VoiceServer | null> {
    const [rows] = await dbPool.execute<VoiceServerRow[]>(
      `SELECT ${selectFields} FROM voice_api WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? this.toVoiceServer(rows[0]) : null;
  }

  async create(data: VoiceServerWriteFields, actorId: number): Promise<VoiceServer> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO voice_api (name, sid, token, phone_number, status, created_by, created)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [data.name, data.sid, data.token, data.phoneNumber, data.status, actorId],
    );
    const server = await this.findById(result.insertId);
    if (!server) throw new Error('Voice server was created but could not be retrieved.');
    return server;
  }

  async update(
    id: number,
    data: Partial<VoiceServerWriteFields>,
    actorId: number,
  ): Promise<VoiceServer | null> {
    const columnMap: Record<keyof VoiceServerWriteFields, string> = {
      name: 'name',
      sid: 'sid',
      token: 'token',
      phoneNumber: 'phone_number',
      status: 'status',
    };
    const fields: string[] = [];
    const values: Array<string | number> = [];

    for (const key of Object.keys(columnMap) as Array<keyof VoiceServerWriteFields>) {
      if (data[key] !== undefined) {
        fields.push(`${columnMap[key]} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return this.findById(id);

    fields.push('modified_by = ?', 'modified = CURRENT_TIMESTAMP');
    values.push(actorId, id);
    await dbPool.execute<ResultSetHeader>(
      `UPDATE voice_api SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      'DELETE FROM voice_api WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  }

  async deleteMany(ids: number[]): Promise<number> {
    const placeholders = ids.map(() => '?').join(', ');
    const [result] = await dbPool.execute<ResultSetHeader>(
      `DELETE FROM voice_api WHERE id IN (${placeholders})`,
      ids,
    );
    return result.affectedRows;
  }

  private toVoiceServer(row: VoiceServerRow): VoiceServer {
    return {
      id: row.id,
      name: row.name,
      phoneNumber: row.phone_number,
      status: row.status,
      created: this.toDateString(row.created),
      createdBy: row.created_by,
      modified: row.modified ? this.toDateString(row.modified) : null,
      modifiedBy: row.modified_by,
    };
  }

  private toDateString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : value;
  }
}
