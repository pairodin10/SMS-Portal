import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { dbPool } from '../config/database';
import { GatewayParameterInput } from '../dto/AllanGatewayDto';

export interface AllanGatewayParameter {
  id: number;
  name: string;
  configured: boolean;
  status: number;
}

export interface AllanGateway {
  id: number;
  name: string;
  apiLink: string;
  sourceParam: string;
  sourceValue: string | null;
  destinationParam: string;
  messageParam: string;
  unicodeParam: string | null;
  unicodeValue: string | null;
  successKeyword: string | null;
  status: number;
  createdBy: number | null;
  modifiedBy: number | null;
  created: string;
  modified: string | null;
  gatewayParams: AllanGatewayParameter[];
}

interface AllanGatewayRow extends RowDataPacket {
  id: number;
  name: string;
  api_link: string;
  source_param: string;
  source_value: string | null;
  destination_param: string;
  message_param: string;
  unicode_param: string | null;
  unicode_value: string | null;
  success_keyword: string | null;
  status: number;
  created_by: number | null;
  modified_by: number | null;
  created: Date | string;
  modified: Date | string | null;
}

interface AllanGatewayParameterRow extends RowDataPacket {
  id: number;
  sms_gateway_id: number;
  name: string | null;
  value: string | null;
  status: number;
}

type GatewayWriteFields = Omit<AllanGateway, 'id' | 'createdBy' | 'modifiedBy' | 'created' | 'modified' | 'gatewayParams'>;

const selectFields = `id, name, api_link, source_param, source_value, destination_param,
  message_param, unicode_param, unicode_value, success_keyword, status, created_by,
  modified_by, created, modified`;

export class AllanGatewayRepository {
  async findAll(): Promise<AllanGateway[]> {
    const [rows] = await dbPool.query<AllanGatewayRow[]>(
      `SELECT ${selectFields} FROM allan_gateways ORDER BY id DESC`,
    );
    return this.attachParameters(rows);
  }

  async findActive(): Promise<AllanGateway[]> {
    const [rows] = await dbPool.query<AllanGatewayRow[]>(
      `SELECT ${selectFields} FROM allan_gateways WHERE status = 1 ORDER BY id DESC`,
    );
    return this.attachParameters(rows);
  }

  async findById(id: number): Promise<AllanGateway | null> {
    const [rows] = await dbPool.execute<AllanGatewayRow[]>(
      `SELECT ${selectFields} FROM allan_gateways WHERE id = ? LIMIT 1`,
      [id],
    );
    if (!rows[0]) return null;
    const [parameters] = await dbPool.execute<AllanGatewayParameterRow[]>(
      `SELECT id, sms_gateway_id, name, value, status
       FROM sms_gateway_params WHERE sms_gateway_id = ? ORDER BY id`,
      [id],
    );
    return this.toGateway(rows[0], parameters);
  }

  async create(
    data: GatewayWriteFields,
    actorId: number | null,
    gatewayParams: GatewayParameterInput[],
  ): Promise<AllanGateway> {
    const connection = await dbPool.getConnection();
    let insertId: number;
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO allan_gateways
          (name, api_link, source_param, source_value, destination_param, message_param,
           unicode_param, unicode_value, success_keyword, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.name,
          data.apiLink,
          data.sourceParam,
          data.sourceValue,
          data.destinationParam,
          data.messageParam,
          data.unicodeParam,
          data.unicodeValue,
          data.successKeyword,
          data.status,
          actorId,
        ],
      );
      insertId = result.insertId;
      await this.insertParameters(connection, insertId, gatewayParams, actorId);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    const gateway = await this.findById(insertId);
    if (!gateway) {
      throw new Error('Gateway was created but could not be retrieved.');
    }
    return gateway;
  }

  async update(
    id: number,
    data: Partial<GatewayWriteFields>,
    actorId: number | null,
    gatewayParams?: GatewayParameterInput[],
  ): Promise<AllanGateway | null> {
    const columnMap: Record<keyof GatewayWriteFields, string> = {
      name: 'name',
      apiLink: 'api_link',
      sourceParam: 'source_param',
      sourceValue: 'source_value',
      destinationParam: 'destination_param',
      messageParam: 'message_param',
      unicodeParam: 'unicode_param',
      unicodeValue: 'unicode_value',
      successKeyword: 'success_keyword',
      status: 'status',
    };
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();
      const [gatewayRows] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM allan_gateways WHERE id = ? FOR UPDATE',
        [id],
      );
      if (!gatewayRows.length) {
        await connection.rollback();
        return null;
      }

      const fields: string[] = [];
      const values: Array<string | number | null> = [];
      for (const key of Object.keys(columnMap) as Array<keyof GatewayWriteFields>) {
        if (data[key] !== undefined) {
          fields.push(`${columnMap[key]} = ?`);
          values.push(data[key]);
        }
      }
      if (fields.length > 0) {
        fields.push('modified_by = ?', 'modified = CURRENT_TIMESTAMP');
        values.push(actorId, id);
        await connection.execute<ResultSetHeader>(
          `UPDATE allan_gateways SET ${fields.join(', ')} WHERE id = ?`,
          values,
        );
      }
      if (gatewayParams !== undefined) {
        await this.syncParameters(connection, id, gatewayParams, actorId);
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute<ResultSetHeader>(
        'DELETE FROM sms_gateway_params WHERE sms_gateway_id = ?',
        [id],
      );
      const [result] = await connection.execute<ResultSetHeader>(
        'DELETE FROM allan_gateways WHERE id = ?',
        [id],
      );
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteMany(ids: number[]): Promise<number> {
    const placeholders = ids.map(() => '?').join(', ');
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute<ResultSetHeader>(
        `DELETE FROM sms_gateway_params WHERE sms_gateway_id IN (${placeholders})`,
        ids,
      );
      const [result] = await connection.execute<ResultSetHeader>(
        `DELETE FROM allan_gateways WHERE id IN (${placeholders})`,
        ids,
      );
      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private async attachParameters(rows: AllanGatewayRow[]): Promise<AllanGateway[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    const placeholders = ids.map(() => '?').join(', ');
    const [parameters] = await dbPool.query<AllanGatewayParameterRow[]>(
      `SELECT id, sms_gateway_id, name, value, status
       FROM sms_gateway_params WHERE sms_gateway_id IN (${placeholders}) ORDER BY id`,
      ids,
    );
    const parametersByGateway = new Map<number, AllanGatewayParameterRow[]>();
    for (const parameter of parameters) {
      const current = parametersByGateway.get(parameter.sms_gateway_id) ?? [];
      current.push(parameter);
      parametersByGateway.set(parameter.sms_gateway_id, current);
    }
    return rows.map((row) => this.toGateway(row, parametersByGateway.get(row.id) ?? []));
  }

  private toGateway(row: AllanGatewayRow, parameters: AllanGatewayParameterRow[] = []): AllanGateway {
    return {
      id: row.id,
      name: row.name,
      apiLink: row.api_link,
      sourceParam: row.source_param,
      sourceValue: row.source_value,
      destinationParam: row.destination_param,
      messageParam: row.message_param,
      unicodeParam: row.unicode_param,
      unicodeValue: row.unicode_value,
      successKeyword: row.success_keyword,
      status: row.status,
      createdBy: row.created_by,
      modifiedBy: row.modified_by,
      created: this.toDateString(row.created),
      modified: row.modified ? this.toDateString(row.modified) : null,
      gatewayParams: parameters.map((parameter) => ({
        id: parameter.id,
        name: parameter.name ?? '',
        configured: parameter.value !== null && parameter.value !== '',
        status: parameter.status,
      })),
    };
  }

  private async insertParameters(
    connection: PoolConnection,
    gatewayId: number,
    parameters: GatewayParameterInput[],
    actorId: number | null,
  ): Promise<void> {
    for (const parameter of parameters) {
      await connection.execute<ResultSetHeader>(
        `INSERT INTO sms_gateway_params
          (sms_gateway_id, name, value, status, created_by, created)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [gatewayId, parameter.name, parameter.value ?? null, parameter.status, actorId],
      );
    }
  }

  private async syncParameters(
    connection: PoolConnection,
    gatewayId: number,
    parameters: GatewayParameterInput[],
    actorId: number | null,
  ): Promise<void> {
    const [existingRows] = await connection.execute<AllanGatewayParameterRow[]>(
      `SELECT id, sms_gateway_id, name, value, status
       FROM sms_gateway_params WHERE sms_gateway_id = ? FOR UPDATE`,
      [gatewayId],
    );
    const existingById = new Map(existingRows.map((row) => [row.id, row]));
    const retainedIds = new Set<number>();

    for (const parameter of parameters) {
      if (parameter.id === undefined) {
        await this.insertParameters(connection, gatewayId, [parameter], actorId);
        continue;
      }
      const existing = existingById.get(parameter.id);
      if (!existing) {
        throw new Error('A gateway parameter does not belong to this SMS server.');
      }
      retainedIds.add(parameter.id);
      await connection.execute<ResultSetHeader>(
        `UPDATE sms_gateway_params
         SET name = ?, value = ?, status = ?, modified_by = ?, modified = CURRENT_TIMESTAMP
         WHERE id = ? AND sms_gateway_id = ?`,
        [
          parameter.name,
          parameter.value !== undefined ? parameter.value : existing.value,
          parameter.status,
          actorId,
          parameter.id,
          gatewayId,
        ],
      );
    }

    const removedIds = existingRows
      .filter((row) => !retainedIds.has(row.id))
      .map((row) => row.id);
    if (removedIds.length > 0) {
      const placeholders = removedIds.map(() => '?').join(', ');
      await connection.execute<ResultSetHeader>(
        `DELETE FROM sms_gateway_params WHERE sms_gateway_id = ? AND id IN (${placeholders})`,
        [gatewayId, ...removedIds],
      );
    }
  }

  private toDateString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : value;
  }
}
