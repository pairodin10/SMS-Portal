import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { dbPool } from '../config/database';

export interface ImeiSetting {
  id: number;
  name: string;
  service: string;
  serviceValue: number;
  servicePrice: number;
  status: number;
  created: string;
  createdBy: number;
  modified: string | null;
  modifiedBy: number | null;
}

export interface ImeiSettingOption {
  id: number;
  name: string;
  servicePrice: number;
}

interface ImeiSettingRow extends RowDataPacket {
  id: number;
  name: string;
  service: string;
  service_value: number;
  service_price: number | string;
  status: number;
  created: Date | string;
  created_by: number;
  modified: Date | string | null;
  modified_by: number | null;
}

type ImeiSettingsWriteFields = Omit<ImeiSetting, 'id' | 'created' | 'createdBy' | 'modified' | 'modifiedBy'>;
const selectFields = `id, name, service, service_value, service_price, status,
  created, created_by, modified, modified_by`;

export class ImeiSettingsRepository {
  async findAll(): Promise<ImeiSetting[]> {
    const [rows] = await dbPool.query<ImeiSettingRow[]>(
      `SELECT ${selectFields} FROM imei_settings ORDER BY name ASC, id ASC`,
    );
    return rows.map((row) => this.toSetting(row));
  }

  async findActive(): Promise<ImeiSettingOption[]> {
    const [rows] = await dbPool.query<ImeiSettingRow[]>(
      `SELECT id, name, service_price
       FROM imei_settings
       WHERE status = 1
       ORDER BY name ASC, id ASC`,
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      servicePrice: Number(row.service_price),
    }));
  }

  async findById(id: number): Promise<ImeiSetting | null> {
    const [rows] = await dbPool.execute<ImeiSettingRow[]>(
      `SELECT ${selectFields} FROM imei_settings WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? this.toSetting(rows[0]) : null;
  }

  async create(data: ImeiSettingsWriteFields, actorId: number): Promise<ImeiSetting> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO imei_settings
        (name, service, service_value, service_price, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.name, data.service, data.serviceValue, data.servicePrice, data.status, actorId],
    );
    const setting = await this.findById(result.insertId);
    if (!setting) {
      throw new Error('IMEI setting was created but could not be retrieved.');
    }
    return setting;
  }

  async update(
    id: number,
    data: Partial<ImeiSettingsWriteFields>,
    actorId: number,
  ): Promise<ImeiSetting | null> {
    const columnMap: Record<keyof ImeiSettingsWriteFields, string> = {
      name: 'name',
      service: 'service',
      serviceValue: 'service_value',
      servicePrice: 'service_price',
      status: 'status',
    };
    const fields: string[] = [];
    const values: Array<string | number> = [];

    for (const key of Object.keys(columnMap) as Array<keyof ImeiSettingsWriteFields>) {
      if (data[key] !== undefined) {
        fields.push(`${columnMap[key]} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return this.findById(id);

    fields.push('modified = CURRENT_TIMESTAMP', 'modified_by = ?');
    values.push(actorId, id);
    await dbPool.execute<ResultSetHeader>(
      `UPDATE imei_settings SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      'DELETE FROM imei_settings WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  }

  async deleteMany(ids: number[]): Promise<number> {
    const placeholders = ids.map(() => '?').join(', ');
    const [result] = await dbPool.execute<ResultSetHeader>(
      `DELETE FROM imei_settings WHERE id IN (${placeholders})`,
      ids,
    );
    return result.affectedRows;
  }

  private toSetting(row: ImeiSettingRow): ImeiSetting {
    return {
      id: row.id,
      name: row.name,
      service: row.service,
      serviceValue: Number(row.service_value),
      servicePrice: Number(row.service_price),
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
