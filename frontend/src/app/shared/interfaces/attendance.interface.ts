export interface Attendance {
  id: string;
  memberId: string;
  memberName?: string;
  membershipStatus?: 'active' | 'expired' | 'unknown';
  daysToExpiry?: number;
  date: Date;
  checkInTime: Date;
  checkOutTime?: Date;
  duration?: number;
  notes?: string;
}

export interface AttendanceFilters {
  startDate?: Date;
  endDate?: Date;
  memberId?: string;
  membershipStatus?: 'active' | 'expired' | 'unknown' | 'all';
  searchTerm?: string;
}

export interface DailyAttendanceStats {
  date: string;
  totalCheckins: number;
  activeMembers: number;
  expiredMembers: number;
  averageDuration: number;
  uniqueMembers: number;
}

export interface AttendanceAnalytics {
  dailyStats: DailyAttendanceStats[];
  summary: {
    totalActiveUsers: number;
    averageDaily: number;
    minDaily: number;
    maxDaily: number;
    activeVsExpiredRatio: number;
    totalAttendanceRecords: number;
  };
  trends: {
    weeklyGrowth: number;
    mostActiveDay: string;
    peakHours: { hour: number; count: number }[];
  };
}

export interface AttendanceResponse {
  status: 'success' | 'error';
  data?: Attendance | Attendance[] | AttendanceAnalytics;
  message?: string;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}
