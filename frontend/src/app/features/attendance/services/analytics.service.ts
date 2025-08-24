import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceAnalytics, DailyAttendanceStats } from '../../../shared/interfaces/attendance.interface';

export interface AttendanceInsight {
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  value?: string;
}

export interface AttendanceTrend {
  period: 'daily' | 'weekly' | 'monthly';
  data: { label: string; value: number }[];
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private attendanceService: AttendanceService) {}

  getInsights(): Observable<AttendanceInsight[]> {
    return this.attendanceService.analytics$.pipe(
      map(analytics => {
        if (!analytics) return [];
        
        const insights: AttendanceInsight[] = [];

        // Active vs Expired ratio insight
        if (analytics.summary.activeVsExpiredRatio > 2) {
          insights.push({
            title: 'Healthy Membership',
            description: `Active members are ${analytics.summary.activeVsExpiredRatio.toFixed(1)}x more likely to attend than expired members`,
            type: 'positive',
            value: `${analytics.summary.activeVsExpiredRatio.toFixed(1)}:1`
          });
        } else if (analytics.summary.activeVsExpiredRatio < 1) {
          insights.push({
            title: 'Membership Concern',
            description: 'More expired members are attending than active ones. Consider membership renewal campaigns.',
            type: 'negative'
          });
        }

        // Weekly growth insight
        if (analytics.trends.weeklyGrowth > 10) {
          insights.push({
            title: 'Growing Attendance',
            description: `Attendance increased by ${analytics.trends.weeklyGrowth.toFixed(1)}% this week`,
            type: 'positive',
            value: `+${analytics.trends.weeklyGrowth.toFixed(1)}%`
          });
        } else if (analytics.trends.weeklyGrowth < -10) {
          insights.push({
            title: 'Declining Attendance',
            description: `Attendance decreased by ${Math.abs(analytics.trends.weeklyGrowth).toFixed(1)}% this week`,
            type: 'negative',
            value: `${analytics.trends.weeklyGrowth.toFixed(1)}%`
          });
        }

        // Peak hours insight
        if (analytics.trends.peakHours.length > 0) {
          const peakHour = analytics.trends.peakHours[0];
          const timeStr = this.formatHour(peakHour.hour);
          insights.push({
            title: 'Peak Activity',
            description: `Most members check in around ${timeStr}`,
            type: 'neutral',
            value: `${peakHour.count} check-ins`
          });
        }

        // Most active day insight
        insights.push({
          title: 'Popular Day',
          description: `${analytics.trends.mostActiveDay} is the most popular day for attendance`,
          type: 'neutral'
        });

        // Consistency insight
        const variance = this.calculateVariance(analytics.dailyStats.map(d => d.totalCheckins));
        if (variance < analytics.summary.averageDaily * 0.3) {
          insights.push({
            title: 'Consistent Attendance',
            description: 'Daily attendance is very consistent with low variance',
            type: 'positive'
          });
        } else if (variance > analytics.summary.averageDaily * 0.8) {
          insights.push({
            title: 'Variable Attendance',
            description: 'Daily attendance varies significantly. Consider analyzing patterns.',
            type: 'neutral'
          });
        }

        return insights;
      })
    );
  }

  getDailyTrend(days: number = 30): Observable<AttendanceTrend> {
    return this.attendanceService.analytics$.pipe(
      map(analytics => {
        if (!analytics) {
          return {
            period: 'daily' as const,
            data: [],
            trend: 'stable' as const,
            percentage: 0
          };
        }

        const recentStats = analytics.dailyStats.slice(-days);
        const data = recentStats.map(stat => ({
          label: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: stat.totalCheckins
        }));

        // Calculate trend
        const firstHalf = recentStats.slice(0, Math.floor(recentStats.length / 2));
        const secondHalf = recentStats.slice(Math.floor(recentStats.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, stat) => sum + stat.totalCheckins, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, stat) => sum + stat.totalCheckins, 0) / secondHalf.length;
        
        const percentage = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
        const trend = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';

        return {
          period: 'daily' as const,
          data,
          trend,
          percentage: Math.round(percentage * 100) / 100
        };
      })
    );
  }

  getWeeklyTrend(): Observable<AttendanceTrend> {
    return this.attendanceService.analytics$.pipe(
      map(analytics => {
        if (!analytics) {
          return {
            period: 'weekly' as const,
            data: [],
            trend: 'stable' as const,
            percentage: 0
          };
        }

        // Group by week
        const weeklyData = new Map<string, number>();
        analytics.dailyStats.forEach(stat => {
          const date = new Date(stat.date);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
          const weekKey = weekStart.toISOString().split('T')[0];
          
          weeklyData.set(weekKey, (weeklyData.get(weekKey) || 0) + stat.totalCheckins);
        });

        const data = Array.from(weeklyData.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-8) // Last 8 weeks
          .map(([weekStart, total]) => ({
            label: new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: total
          }));

        // Calculate trend
        const values = data.map(d => d.value);
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        const percentage = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
        const trend = percentage > 10 ? 'up' : percentage < -10 ? 'down' : 'stable';

        return {
          period: 'weekly' as const,
          data,
          trend,
          percentage: Math.round(percentage * 100) / 100
        };
      })
    );
  }

  getMembershipStatusDistribution(): Observable<{ label: string; value: number; percentage: number }[]> {
    return this.attendanceService.attendance$.pipe(
      map(attendance => {
        const statusCount = new Map<string, number>();
        
        attendance.forEach(record => {
          const status = record.membershipStatus || 'unknown';
          statusCount.set(status, (statusCount.get(status) || 0) + 1);
        });

        const total = attendance.length;
        return Array.from(statusCount.entries()).map(([status, count]) => ({
          label: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }));
      })
    );
  }

  getPeakHoursData(): Observable<{ hour: string; count: number }[]> {
    return this.attendanceService.analytics$.pipe(
      map(analytics => {
        if (!analytics) return [];
        
        return analytics.trends.peakHours.map(peak => ({
          hour: this.formatHour(peak.hour),
          count: peak.count
        }));
      })
    );
  }

  getAttendanceByDayOfWeek(): Observable<{ day: string; count: number }[]> {
    return this.attendanceService.attendance$.pipe(
      map(attendance => {
        const dayCount = new Map<string, number>();
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Initialize all days
        daysOfWeek.forEach(day => dayCount.set(day, 0));
        
        attendance.forEach(record => {
          const dayOfWeek = new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' });
          dayCount.set(dayOfWeek, (dayCount.get(dayOfWeek) || 0) + 1);
        });

        return daysOfWeek.map(day => ({
          day,
          count: dayCount.get(day) || 0
        }));
      })
    );
  }

  private formatHour(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}
