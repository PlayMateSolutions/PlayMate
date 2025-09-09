import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonText,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  ToastController
} from '@ionic/angular/standalone';
import { AttendanceDB } from './services/attendance-db';
import { Attendance } from '../../shared/interfaces/attendance.interface';
import { GoogleChart, ChartType } from 'angular-google-charts';
import { AttendanceService } from './services/attendance.service';
import { addIcons } from 'ionicons';
import { 
  refresh, 
  chevronBackOutline, 
  chevronForwardOutline,
  peopleOutline,
  calendarOutline,
  trendingUpOutline,
  trendingDownOutline,
  statsChartOutline,
  eyeOutline,
  analyticsOutline,
  timeOutline,
  people,
  calendar,
  statsChart,
  trendingUp,
  trendingDown,
  eye,
  card,
  analytics
} from 'ionicons/icons';
import { ClubContextService } from '../../core/services/club-context.service';
import { RelativeTimePipe } from '../members/relative-time.pipe';

interface DailyAttendanceData {
  date: string;
  count: number;
}

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.page.html',
  styleUrls: ['./attendance.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    IonText,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    GoogleChart,
    RelativeTimePipe
  ]
})
export class AttendancePage implements OnInit {
  loading = true;
  refreshing = false;
  viewPeriod = 'weekly';
  
  // Navigation dates
  currentDate = new Date();
  currentWeekStart = new Date();
  currentMonth = new Date();
  
  dailyData: DailyAttendanceData[] = [];
  chartData: any[][] = [];
  chartColumns = ['Date', 'Attendance', {'type': 'string', 'role': 'tooltip'}, {'type': 'string', 'role': 'annotation'}];
  chartType: ChartType = ChartType.ColumnChart;
  uniqueMembersCount = 0;
  averageAttendance = 0;
  highestAttendance = { day: '', count: 0 };
  lowestAttendance = { day: '', count: 0 };
  daysWithNoAttendance = 0;
  totalAttendanceCount = 0;
  expiredMembershipsCount = 0;
  hasDataForCurrentPeriod = false;
  lastAttendanceSync: Date | null = null;

  constructor(
    private attendanceService: AttendanceService,
    private toastController: ToastController,
    private router: Router,
    private clubContext: ClubContextService
  ) {
    addIcons({ 
      refresh, 
      chevronBackOutline, 
      chevronForwardOutline,
      peopleOutline, 
      calendarOutline,
      trendingUpOutline,
      trendingDownOutline,
      statsChartOutline,
      eyeOutline,
      analyticsOutline,
      timeOutline,
      people,
      calendar,
      statsChart,
      trendingUp,
      trendingDown,
      eye,
      analytics
    });
    
    // Initialize current week start (Monday)
    this.setCurrentWeekStart();
    // Initialize current month
    this.currentMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    this.lastAttendanceSync = this.clubContext.getLastAttendanceRefresh();
  }
  chartOptions: any = {
    backgroundColor: 'transparent',
    colors: ['#4CAF50'],
    chartArea: {
      left: 20, // reduced from 60
      top: 20,
      width: '90%',
      height: '75%'
    },
    hAxis: {
      textStyle: { fontSize: 12, color: '#666' },
      gridlines: { color: 'transparent' }
    },
    vAxis: {
      textStyle: { fontSize: 12, color: '#666' },
      gridlines: { color: '#e0e0e0', count: 5 },
      minValue: 0
    },
    legend: { position: 'none' },
    animation: {
      startup: true,
      duration: 1000,
      easing: 'out'
    }
  };

  ngOnInit() {
    // Set chart type based on initial period
    if (this.viewPeriod === 'weekly') {
      this.chartType = ChartType.ColumnChart;
    } else if (this.viewPeriod === 'monthly') {
      this.chartType = ChartType.LineChart;
    }
    this.loadAttendanceData();
  }

  async loadAttendanceData() {
    try {
      this.loading = true;
      console.log('Loading attendance data from IndexedDB...');
      
      const attendanceRecords = await AttendanceDB.getAll();
      console.log('Loaded records:', attendanceRecords.length);
      
      // Get date range for current period
      const dateRange = this.getDateRangeForCurrentView();
      const startDate = new Date(dateRange[0]);
      const endDate = new Date(dateRange[dateRange.length - 1]);
      endDate.setHours(23, 59, 59, 999); // End of the day
      
      // Check if there are any records for the current period
      const recordsForCurrentPeriod = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });
      
      this.hasDataForCurrentPeriod = recordsForCurrentPeriod.length > 0;
      
      this.dailyData = this.calculateDailyAttendance(attendanceRecords);
      this.chartData = this.prepareChartData(this.dailyData);
      
      // Calculate statistics
      this.calculateStatistics(this.dailyData, attendanceRecords);
      
      // Update chart options to include annotations
      this.updateChartOptions();
      
      // Update last attendance sync time
      this.lastAttendanceSync = this.clubContext.getLastAttendanceRefresh();
      
      console.log('Daily data:', this.dailyData);
      console.log('Chart data:', this.chartData);
      console.log('Has data for current period:', this.hasDataForCurrentPeriod);
      
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      this.loading = false;
    }
  }

  private calculateDailyAttendance(records: Attendance[]): DailyAttendanceData[] {
    const dailyCount = new Map<string, number>();
    
    records.forEach(record => {
      const dateStr = new Date(record.date).toISOString().split('T')[0]; // YYYY-MM-DD format
      dailyCount.set(dateStr, (dailyCount.get(dateStr) || 0) + 1);
    });

    // Get date range based on current view
    const dateRange = this.getDateRangeForCurrentView();
    const result: DailyAttendanceData[] = [];

    // Create data for each day in the range
    dateRange.forEach(dateStr => {
      const count = dailyCount.get(dateStr) || 0;
      result.push({ date: dateStr, count });
    });

    return result;
  }

  private getDateRangeForCurrentView(): string[] {
    const dates: string[] = [];
    
    switch(this.viewPeriod) {
      case 'weekly':
        // Get 7 days starting from currentWeekStart
        for (let i = 0; i < 7; i++) {
          const date = new Date(this.currentWeekStart);
          date.setDate(this.currentWeekStart.getDate() + i);
          dates.push(date.toISOString().split('T')[0]);
        }
        break;
        
      case 'monthly':
        // Get all days in the current month
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          dates.push(date.toISOString().split('T')[0]);
        }
        break;
        
      default: // daily
        // Get last 30 days
        for (let i = 29; i >= 0; i--) {
          const date = new Date(this.currentDate);
          date.setDate(this.currentDate.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }
        break;
    }
    
    return dates;
  }

  private setCurrentWeekStart() {
    // Set to Monday of current week
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0, Monday is 1
    
    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setDate(today.getDate() - daysToMonday);
    this.currentWeekStart.setHours(0, 0, 0, 0);
  }

  private prepareChartData(dailyData: DailyAttendanceData[]): any[][] {
    if (!dailyData || dailyData.length === 0) {
      return [];
    }

    // Sort days chronologically
    dailyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return dailyData.map(day => {
      const count = day.count || 0;
      // Create array with [date string, count, tooltip, formatted count for annotation]
      return [
        this.formatDate(day.date), 
        count, 
        `${day.date}: ${count} ${count === 1 ? 'person' : 'people'}`, 
        count.toString()
      ];
    });
  }
  
  private calculateStatistics(dailyData: DailyAttendanceData[], attendanceRecords: Attendance[]) {
    if (!dailyData || dailyData.length === 0) {
      this.uniqueMembersCount = 0;
      this.averageAttendance = 0;
      this.highestAttendance = { day: '', count: 0 };
      this.lowestAttendance = { day: '', count: 0 };
      this.daysWithNoAttendance = 0;
      this.totalAttendanceCount = 0;
      this.expiredMembershipsCount = 0;
      return;
    }
    
    // Get date range for current period
    const dateRange = this.getDateRangeForCurrentView();
    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[dateRange.length - 1]);
    endDate.setHours(23, 59, 59, 999); // End of the day
    
    // Filter attendance records for the current period
    const periodAttendanceRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });
    
    // Calculate total attendance count (sum of all counts)
    this.totalAttendanceCount = dailyData.reduce((sum, day) => sum + (day.count || 0), 0);
    
    // Calculate average attendance
    this.averageAttendance = this.totalAttendanceCount / dailyData.length;
    
    // Find highest and lowest attendance
    let highest = { day: '', count: 0 };
    let lowest = { day: '', count: Number.MAX_SAFE_INTEGER };
    
    dailyData.forEach(day => {
      const count = day.count || 0;
      if (count > highest.count) {
        highest = { day: day.date, count };
      }
      if (count < lowest.count) {
        lowest = { day: day.date, count };
      }
    });
    
    this.highestAttendance = highest;
    this.lowestAttendance = lowest.count === Number.MAX_SAFE_INTEGER ? { day: '', count: 0 } : lowest;
    
    // Count days with no attendance
    this.daysWithNoAttendance = dailyData.filter(day => !day.count || day.count === 0).length;
    
    // Count attendance with expired memberships
    this.expiredMembershipsCount = periodAttendanceRecords.filter(record => {
      // Check if the member has an expired membership at the time of attendance
      return record.membershipStatus === 'expired';
    }).length;
    
    // Calculate unique members count (using Set to find unique memberIds)
    const uniqueMemberIds = new Set(periodAttendanceRecords.map(record => record.memberId));
    this.uniqueMembersCount = uniqueMemberIds.size;
  }

  private formatDateForDisplay(dateStr: string, period: string = this.viewPeriod): string {
    const date = new Date(dateStr);
    
    switch(period) {
      case 'weekly':
        return date.toLocaleDateString('en-US', { 
          weekday: 'short'
        });
      
      case 'monthly':
        return date.toLocaleDateString('en-US', {
          day: 'numeric'
        });
      
      default: // weekly fallback
        return date.toLocaleDateString('en-US', {
          weekday: 'short'
        });
    }
  }
  
  formatDate(dateStr: string): string {
    return this.formatDateForDisplay(dateStr);
  }

  async refreshAttendance() {
    try {
      this.refreshing = true;
      console.log('Refreshing attendance data...');
      
      // Use the AttendanceService to sync data
      await this.attendanceService.syncAttendance(false); // false = incremental sync
      
      // Reload the chart data
      await this.loadAttendanceData();
      
      console.log('Attendance data refreshed successfully');
      
      // Show success toast
      const toast = await this.toastController.create({
        message: 'Attendance data refreshed successfully',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
      
    } catch (error) {
      console.error('Error refreshing attendance data:', error);
      
      // Show error toast
      const toast = await this.toastController.create({
        message: 'Failed to refresh attendance data',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.refreshing = false;
    }
  }

  onPeriodChange(event: any) {
    this.viewPeriod = event.detail.value;
    console.log('Period changed to:', this.viewPeriod);
    // Set chart type based on period
    if (this.viewPeriod === 'weekly') {
      this.chartType = ChartType.ColumnChart;
    } else if (this.viewPeriod === 'monthly') {
      this.chartType = ChartType.LineChart;
    }
    // Reset to current period when switching views
    if (this.viewPeriod === 'weekly') {
      this.setCurrentWeekStart();
    } else if (this.viewPeriod === 'monthly') {
      this.currentMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    }
    // Recalculate chart data with new period
    this.loadAttendanceData();
  }

  // Navigation methods
  goToPreviousWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.loadAttendanceData();
  }

  goToNextWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.loadAttendanceData();
  }

  goToPreviousMonth() {
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.loadAttendanceData();
  }

  goToNextMonth() {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.loadAttendanceData();
  }
  
  // Navigate to attendance details page
  navigateToAttendanceDetails() {
    // Get date range for current period to pass to the details page
    const dateRange = this.getDateRangeForCurrentView();
    const startDate = dateRange[0];
    const endDate = dateRange[dateRange.length - 1];
    
    // Navigate to attendance details with query parameters
    this.router.navigate(['/tabs/attendance-details'], { 
      queryParams: { 
        startDate: startDate,
        endDate: endDate,
        period: this.viewPeriod,
        periodLabel: this.getCurrentPeriodText(),
        scrollToDate: startDate // Pass scrollToDate for auto-scroll
      },
      skipLocationChange: false  // Make sure the URL is updated
    });
  }

  // Get display text for current period
  getCurrentPeriodText(): string {
    switch(this.viewPeriod) {
      case 'weekly':
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(this.currentWeekStart.getDate() + 6);
        return `${this.currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      
      case 'monthly':
        return this.currentMonth.toLocaleDateString('en-US', { 
          year: 'numeric',
          month: 'long'
        });
      
      default:
        return 'This Week';
    }
  }

  // Get chart title based on current period
  getChartTitle(): string {
    const periodText = this.viewPeriod.charAt(0).toUpperCase() + this.viewPeriod.slice(1);
    return `${periodText} Attendance Analytics`;
  }

  // Check if navigation buttons should be enabled
  canGoToNextWeek(): boolean {
    const nextWeek = new Date(this.currentWeekStart);
    nextWeek.setDate(this.currentWeekStart.getDate() + 7);
    return nextWeek <= new Date();
  }

  canGoToNextMonth(): boolean {
    const nextMonth = new Date(this.currentMonth);
    nextMonth.setMonth(this.currentMonth.getMonth() + 1);
    const now = new Date();
    return nextMonth <= new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  private updateChartOptions() {
    // Calculate max value for chart
    const maxValue = this.chartData.length > 0 
      ? Math.max(...this.chartData.map(item => item[1]), 10) * 1.1 
      : 10;
    // Update chart options based on the data and view period
    this.chartOptions = {
      backgroundColor: 'transparent',
      colors: ['#4CAF50'],
      chartArea: {
        left: 20, // reduced from 60
        top: 20,
        width: this.viewPeriod === 'monthly' && this.chartData.length > 20 ? '80%' : '90%',
        height: '75%'
      },
      hAxis: {
        textStyle: { fontSize: 12, color: '#666' },
        gridlines: { color: 'transparent' },
        ...(this.viewPeriod === 'monthly' ? { showTextEvery: 5 } : {})
      },
      vAxis: {
        textStyle: { fontSize: 12, color: '#666' },
        gridlines: { color: '#e0e0e0', count: 5 },
        minValue: 0,
        viewWindow: {
          min: 0,
          max: maxValue
        }
      },
      legend: { position: 'none' },
      animation: {
        startup: true,
        duration: 1000,
        easing: 'out'
      },
      annotations: {
        textStyle: {
          fontSize: 12,
          color: '#fff',
          bold: true
        },
        alwaysOutside: false,
        stem: {
          color: 'transparent',
          length: 0
        }
      }
    };
  }
}
