import { RowDataPacket } from 'mysql2';
import { dbPool } from '../config/database';

export interface DashboardMetrics {
  totalSmsSent: number;
  customers: number;
  announcements: number;
  personalSmsSent: number;
  personalVoiceSent: number;
  resellers: number;
  smsServers: number;
  voiceServers: number;
  countryCoverages: number;
}

export interface DashboardActivityDay {
  date: string;
  smsSent: number;
  voiceCalls: number;
}

interface DashboardMetricsRow extends RowDataPacket {
  totalSmsSent: number;
  customers: number;
  announcements: number;
  personalSmsSent: number;
  personalVoiceSent: number;
  resellers: number;
  smsServers: number;
  voiceServers: number;
  countryCoverages: number;
}

interface DashboardActivityRow extends RowDataPacket {
  date: string;
  smsSent: number;
  voiceCalls: number;
}

interface DashboardCurrentDateRow extends RowDataPacket {
  today: string;
}

export class DashboardMetricsRepository {
  async getMetrics(userId: string): Promise<DashboardMetrics> {
    const [rows] = await dbPool.query<DashboardMetricsRow[]>(`
      SELECT
        (SELECT COUNT(*) FROM sms_histories) AS totalSmsSent,
        (SELECT COUNT(*) FROM users WHERE LOWER(role) = 'user') AS customers,
        (SELECT COUNT(*) FROM announcement) AS announcements,
        (SELECT COUNT(*) FROM sms_histories WHERE created_by = ?) AS personalSmsSent,
        (SELECT COUNT(*) FROM calls WHERE user_id = ?) AS personalVoiceSent,
        (SELECT COUNT(*) FROM users WHERE LOWER(role) = 'reseller') AS resellers,
        (SELECT COUNT(*) FROM allan_gateways) AS smsServers,
        (SELECT COUNT(*) FROM voice_api) AS voiceServers,
        (SELECT COUNT(*) FROM setting_coverages) AS countryCoverages
    `, [userId, userId]);
    const row = rows[0];
    if (!row) {
      throw new Error('Dashboard metrics query did not return a result.');
    }

    return {
      totalSmsSent: Number(row.totalSmsSent),
      customers: Number(row.customers),
      announcements: Number(row.announcements),
      personalSmsSent: Number(row.personalSmsSent),
      personalVoiceSent: Number(row.personalVoiceSent),
      resellers: Number(row.resellers),
      smsServers: Number(row.smsServers),
      voiceServers: Number(row.voiceServers),
      countryCoverages: Number(row.countryCoverages),
    };
  }

  async getActivity(userId: string): Promise<DashboardActivityDay[]> {
    const [[dateRows], [activityRows]] = await Promise.all([
      dbPool.query<DashboardCurrentDateRow[]>(
        `SELECT DATE_FORMAT(CURRENT_DATE, '%Y-%m-%d') AS today`,
      ),
      dbPool.query<DashboardActivityRow[]>(`
        SELECT
          DATE_FORMAT(activity_date, '%Y-%m-%d') AS date,
          SUM(sms_sent) AS smsSent,
          SUM(voice_calls) AS voiceCalls
        FROM (
          SELECT DATE(created) AS activity_date, COUNT(*) AS sms_sent, 0 AS voice_calls
          FROM sms_histories
          WHERE created >= CURRENT_DATE - INTERVAL 29 DAY
            AND created < CURRENT_DATE + INTERVAL 1 DAY
            AND created_by = ?
          GROUP BY DATE(created)
          UNION ALL
          SELECT DATE(created) AS activity_date, 0 AS sms_sent, COUNT(*) AS voice_calls
          FROM calls
          WHERE created >= CURRENT_DATE - INTERVAL 29 DAY
            AND created < CURRENT_DATE + INTERVAL 1 DAY
            AND user_id = ?
          GROUP BY DATE(created)
        ) daily_activity
        GROUP BY activity_date
        ORDER BY activity_date
      `, [userId, userId]),
    ]);

    if (!dateRows[0]?.today) {
      throw new Error('Dashboard activity date query did not return a result.');
    }

    const activityByDate = new Map(
      activityRows.map((row) => [
        row.date,
        { smsSent: Number(row.smsSent), voiceCalls: Number(row.voiceCalls) },
      ]),
    );
    const [year, month, day] = dateRows[0].today.split('-').map(Number);
    const today = Date.UTC(year, month - 1, day);

    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today - (29 - index) * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const activity = activityByDate.get(date);
      return {
        date,
        smsSent: activity?.smsSent ?? 0,
        voiceCalls: activity?.voiceCalls ?? 0,
      };
    });
  }
}
