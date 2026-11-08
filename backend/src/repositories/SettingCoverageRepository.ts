import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { dbPool } from '../config/database';

export interface SettingCoverage {
  id: number;
  countryName: string | null;
  regionCode: string | null;
  isoCode: string | null;
  countryCode: string | null;
  plainTariff: number;
  voiceTariff: number;
  command: string;
  description: string | null;
  status: number;
  created: string | null;
  modified: string | null;
}

export interface CountryOption {
  id: number;
  countryName: string;
}

interface SettingCoverageRow extends RowDataPacket {
  id: number;
  country_name: string | null;
  region_code: string | null;
  iso_code: string | null;
  country_code: string | null;
  plain_tariff: number | string;
  voice_tariff: number | string;
  command: string;
  description: string | null;
  status: number;
  created: Date | string | null;
  modified: Date | string | null;
}

interface CountryOptionRow extends RowDataPacket {
  id: number;
  country_name: string | null;
}

type CoverageWriteFields = Omit<SettingCoverage, 'id' | 'created' | 'modified'>;

const selectFields = `id, country_name, region_code, iso_code, country_code, plain_tariff,
  voice_tariff, command, description, status, created, modified`;

export class SettingCoverageRepository {
  async findAll(): Promise<SettingCoverage[]> {
    const [rows] = await dbPool.query<SettingCoverageRow[]>(
      `SELECT ${selectFields} FROM setting_coverages ORDER BY country_name ASC, id ASC`,
    );
    return rows.map((row) => this.toCoverage(row));
  }

  async findActiveCountries(): Promise<CountryOption[]> {
    const [rows] = await dbPool.query<CountryOptionRow[]>(
      `SELECT MIN(id) AS id, TRIM(country_name) AS country_name
       FROM setting_coverages
       WHERE status = 1 AND country_name IS NOT NULL AND TRIM(country_name) <> ''
       GROUP BY LOWER(TRIM(country_name)), TRIM(country_name)
       ORDER BY TRIM(country_name) ASC`,
    );
    return rows.map((row) => ({
      id: row.id,
      countryName: row.country_name ?? '',
    }));
  }

  async findById(id: number): Promise<SettingCoverage | null> {
    const [rows] = await dbPool.execute<SettingCoverageRow[]>(
      `SELECT ${selectFields} FROM setting_coverages WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? this.toCoverage(rows[0]) : null;
  }

  async create(data: CoverageWriteFields, actorId: number | null): Promise<SettingCoverage> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO setting_coverages
        (country_name, region_code, iso_code, country_code, plain_tariff, voice_tariff,
         command, description, status, created, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      [
        data.countryName,
        data.regionCode,
        data.isoCode,
        data.countryCode,
        data.plainTariff,
        data.voiceTariff,
        data.command,
        data.description,
        data.status,
        actorId,
      ],
    );
    const coverage = await this.findById(result.insertId);
    if (!coverage) {
      throw new Error('Country coverage was created but could not be retrieved.');
    }
    return coverage;
  }

  async update(
    id: number,
    data: Partial<CoverageWriteFields>,
    actorId: number | null,
  ): Promise<SettingCoverage | null> {
    const columnMap: Record<keyof CoverageWriteFields, string> = {
      countryName: 'country_name',
      regionCode: 'region_code',
      isoCode: 'iso_code',
      countryCode: 'country_code',
      plainTariff: 'plain_tariff',
      voiceTariff: 'voice_tariff',
      command: 'command',
      description: 'description',
      status: 'status',
    };
    const fields: string[] = [];
    const values: Array<string | number | null> = [];

    for (const key of Object.keys(columnMap) as Array<keyof CoverageWriteFields>) {
      if (data[key] !== undefined) {
        fields.push(`${columnMap[key]} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('modified = CURRENT_TIMESTAMP', 'modified_by = ?');
    values.push(actorId, id);
    await dbPool.execute<ResultSetHeader>(
      `UPDATE setting_coverages SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      'DELETE FROM setting_coverages WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  }

  async deleteMany(ids: number[]): Promise<number> {
    const placeholders = ids.map(() => '?').join(', ');
    const [result] = await dbPool.execute<ResultSetHeader>(
      `DELETE FROM setting_coverages WHERE id IN (${placeholders})`,
      ids,
    );
    return result.affectedRows;
  }

  private toCoverage(row: SettingCoverageRow): SettingCoverage {
    return {
      id: row.id,
      countryName: row.country_name,
      regionCode: row.region_code,
      isoCode: row.iso_code,
      countryCode: row.country_code,
      plainTariff: Number(row.plain_tariff),
      voiceTariff: Number(row.voice_tariff),
      command: row.command,
      description: row.description,
      status: row.status,
      created: this.toDateString(row.created),
      modified: this.toDateString(row.modified),
    };
  }

  private toDateString(value: Date | string | null): string | null {
    if (!value) return null;
    return value instanceof Date ? value.toISOString() : value;
  }
}
