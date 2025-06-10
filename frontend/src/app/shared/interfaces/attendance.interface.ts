export interface Attendance {
  attendanceId: string;
  memberId: string;
  memberName?: string;
  sport: string;
  date: Date;
  checkInTime: Date;
  checkOutTime?: Date;
  duration?: number;
  notes?: string;
}

export interface AttendanceFilters {
  startDate?: Date;
  endDate?: Date;
  sport?: string;
  memberId?: string;
  searchTerm?: string;
}

export interface AttendanceSummary {
  totalSessions: number;
  averageSessionDuration: number;
  sportBreakdown: {
    [key: string]: {
      sessions: number;
      totalDuration: number;
      averageDuration: number;
    }
  };
  timeOfDayBreakdown: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  dayOfWeekBreakdown: {
    [key: string]: number;
  };
}

export interface AttendanceResponse {
  status: 'success' | 'error';
  data?: Attendance | Attendance[] | AttendanceSummary;
  message?: string;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}
