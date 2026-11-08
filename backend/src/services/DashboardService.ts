import { AnnouncementRepository } from '../repositories/AnnouncementRepository';
import { DashboardMetricsRepository } from '../repositories/DashboardMetricsRepository';

export class DashboardService {
  constructor(
    private readonly announcementRepository = new AnnouncementRepository(),
    private readonly metricsRepository = new DashboardMetricsRepository(),
  ) {}

  getLatestAnnouncement() {
    return this.announcementRepository.findLatest();
  }

  getMetrics(userId: string) {
    return this.metricsRepository.getMetrics(userId);
  }

  getActivity(userId: string) {
    return this.metricsRepository.getActivity(userId);
  }

  async getOverview() {
    return {
      availableCredits: 2500,
      totalSmsSent: 14820,
      successRate: 97.8,
      dayRange: 'Last 30 days',
      accountName: 'Super Admin',
      lastUpdated: new Date().toISOString(),
    };
  }

  async getAnalytics() {
    return {
      sentOverTime: [42, 58, 49, 77, 66, 89, 92, 87, 99, 104, 118, 126],
      successVsFailure: {
        success: 1274,
        failed: 22,
      },
      categoryBreakdown: [
        { name: 'Marketing', value: 39 },
        { name: 'Alerts', value: 34 },
        { name: 'OTP', value: 17 },
        { name: 'Transactions', value: 10 },
      ],
      dailyStats: {
        today: 658,
        thisWeek: 4312,
        thisMonth: 14820,
      },
    };
  }
}
