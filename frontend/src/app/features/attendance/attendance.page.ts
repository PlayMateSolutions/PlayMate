import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { refresh, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

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
    GoogleChart
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
  chartColumns = ['Date', 'Attendance'];
  chartType: ChartType = ChartType.ColumnChart;
  totalRecords = 0;

  constructor(
    private attendanceService: AttendanceService,
    private toastController: ToastController
  ) {
    addIcons({ refresh, chevronBackOutline, chevronForwardOutline });
    
    // Initialize current week start (Monday)
    this.setCurrentWeekStart();
    // Initialize current month
    this.currentMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
  }
  chartOptions = {
    backgroundColor: 'transparent',
    colors: ['#4CAF50'],
    chartArea: {
      left: 60,
      top: 20,
      width: '85%',
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
    this.loadAttendanceData();
  }

  async loadAttendanceData() {
    try {
      this.loading = true;
      console.log('Loading attendance data from IndexedDB...');
      
      const attendanceRecords = await AttendanceDB.getAll();
      console.log('Loaded records:', attendanceRecords.length);
      
      this.totalRecords = attendanceRecords.length;
      this.dailyData = this.calculateDailyAttendance(attendanceRecords);
      this.chartData = this.prepareChartData(this.dailyData);
      
      // If no real data, add some test data
      if (this.chartData.length === 0) {
        console.log('No real data found, adding test data...');
        this.chartData = [
          ['Aug 20', 15],
          ['Aug 21', 23],
          ['Aug 22', 18],
          ['Aug 23', 31],
          ['Aug 24', 27]
        ];
        this.totalRecords = 5;
      }
      
      console.log('Daily data:', this.dailyData);
      console.log('Chart data:', this.chartData);
      
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
    return dailyData.map(item => [
      this.formatDate(item.date),
      item.count
    ]);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    
    switch(this.viewPeriod) {
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
}
