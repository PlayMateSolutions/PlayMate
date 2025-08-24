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
  IonMenuButton
} from '@ionic/angular/standalone';
import { AttendanceDB } from './services/attendance-db';
import { Attendance } from '../../shared/interfaces/attendance.interface';
import { BarChartComponent, ChartData } from '../../shared/components/bar-chart/bar-chart.component';

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
    BarChartComponent
  ]
})
export class AttendancePage implements OnInit {
  loading = true;
  dailyData: DailyAttendanceData[] = [];
  chartData: ChartData[] = [];
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
          { label: '2024-08-20', value: 15 },
          { label: '2024-08-21', value: 23 },
          { label: '2024-08-22', value: 18 },
          { label: '2024-08-23', value: 31 },
          { label: '2024-08-24', value: 27 }
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

  private prepareChartData(dailyData: DailyAttendanceData[]): ChartData[] {
    const chartData = dailyData.map(item => ({
      label: item.date,
      value: item.count
    }));
    console.log('Chart data prepared:', chartData);
    return chartData;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}
