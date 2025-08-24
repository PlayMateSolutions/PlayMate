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
  ToastController
} from '@ionic/angular/standalone';
import { AttendanceDB } from './services/attendance-db';
import { Attendance } from '../../shared/interfaces/attendance.interface';
import { GoogleChart, ChartType } from 'angular-google-charts';
import { AttendanceService } from './services/attendance.service';
import { addIcons } from 'ionicons';
import { refresh } from 'ionicons/icons';

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
    GoogleChart
  ]
})
export class AttendancePage implements OnInit {
  loading = true;
  refreshing = false;
  dailyData: DailyAttendanceData[] = [];
  chartData: any[][] = [];
  chartColumns = ['Date', 'Attendance'];
  chartType: ChartType = ChartType.ColumnChart;

  constructor(
    private attendanceService: AttendanceService,
    private toastController: ToastController
  ) {
    addIcons({ refresh });
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
  totalRecords = 0;

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

    // Convert to array and sort by date
    return Array.from(dailyCount.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }

  private prepareChartData(dailyData: DailyAttendanceData[]): any[][] {
    return dailyData.map(item => [
      this.formatDate(item.date),
      item.count
    ]);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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
}
