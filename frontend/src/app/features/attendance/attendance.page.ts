import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList,
  IonItem, 
  IonLabel, 
  IonButton,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  RefresherCustomEvent
} from '@ionic/angular/standalone';
import { 
  addIcons 
} from 'ionicons';
import {
  peopleOutline,
  trendingUpOutline,
  trendingDownOutline,
  timeOutline,
  calendarOutline,
  statsChartOutline,
  personOutline,
  refreshOutline,
  filterOutline,
  eyeOutline
} from 'ionicons/icons';
import { AttendanceService } from './services/attendance.service';
import { AnalyticsService, AttendanceInsight, AttendanceTrend } from './services/analytics.service';
import { Attendance, AttendanceFilters, AttendanceAnalytics } from '../../shared/interfaces/attendance.interface';
import { Subscription } from 'rxjs';

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
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonButtons,
    IonMenuButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonChip,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonText,
    IonSegment,
    IonSegmentButton,
    IonBadge
  ]
})
export class AttendancePage implements OnInit, OnDestroy {
  analytics: AttendanceAnalytics | null = null;
  filteredAttendance: Attendance[] = [];
  insights: AttendanceInsight[] = [];
  dailyTrend: AttendanceTrend | null = null;
  loading = false;
  lastSync: Date | null = null;
  
  // Filter state
  filters: AttendanceFilters = {
    membershipStatus: 'all'
  };
  
  selectedSegment = 'analytics';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private attendanceService: AttendanceService,
    private analyticsService: AnalyticsService
  ) {
    addIcons({
      peopleOutline,
      trendingUpOutline,
      trendingDownOutline,
      timeOutline,
      calendarOutline,
      statsChartOutline,
      personOutline,
      refreshOutline,
      filterOutline,
      eyeOutline
    });
  }

  ngOnInit() {
    this.subscribeToData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private subscribeToData() {
    // Subscribe to analytics
    this.subscriptions.push(
      this.attendanceService.analytics$.subscribe(analytics => {
        console.log('Analytics received:', analytics);
        this.analytics = analytics;
      })
    );

    // Subscribe to loading state
    this.subscriptions.push(
      this.attendanceService.loading$.subscribe(loading => {
        this.loading = loading;
      })
    );

    // Subscribe to last sync time
    this.subscriptions.push(
      this.attendanceService.lastSync$.subscribe(lastSync => {
        this.lastSync = lastSync;
      })
    );

    // Subscribe to filtered attendance
    this.subscriptions.push(
      this.attendanceService.getFilteredAttendance(this.filters).subscribe(attendance => {
        console.log('Filtered attendance received:', attendance.length);
        this.filteredAttendance = attendance;
      })
    );

    // Subscribe to insights
    this.subscriptions.push(
      this.analyticsService.getInsights().subscribe(insights => {
        this.insights = insights;
      })
    );

    // Subscribe to daily trend
    this.subscriptions.push(
      this.analyticsService.getDailyTrend(30).subscribe(trend => {
        this.dailyTrend = trend;
      })
    );
  }

  async handleRefresh(event?: RefresherCustomEvent) {
    try {
      await this.attendanceService.refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      if (event) {
        event.target.complete();
      }
    }
  }

  onFilterChange() {
    this.subscriptions.push(
      this.attendanceService.getFilteredAttendance(this.filters).subscribe(attendance => {
        this.filteredAttendance = attendance;
      })
    );
  }

  onDateFilterChange(event: any, type: 'start' | 'end') {
    if (type === 'start') {
      this.filters.startDate = event.detail.value ? new Date(event.detail.value) : undefined;
    } else {
      this.filters.endDate = event.detail.value ? new Date(event.detail.value) : undefined;
    }
    this.onFilterChange();
  }

  onSearchChange(event: any) {
    this.filters.searchTerm = event.detail.value;
    this.onFilterChange();
  }

  onMembershipStatusChange(event: any) {
    this.filters.membershipStatus = event.detail.value;
    this.onFilterChange();
  }

  clearFilters() {
    this.filters = {
      membershipStatus: 'all'
    };
    this.onFilterChange();
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  getInsightIcon(type: string): string {
    switch (type) {
      case 'positive': return 'trending-up-outline';
      case 'negative': return 'trending-down-outline';
      default: return 'stats-chart-outline';
    }
  }

  getInsightColor(type: string): string {
    switch (type) {
      case 'positive': return 'success';
      case 'negative': return 'danger';
      default: return 'medium';
    }
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return 'trending-up-outline';
      case 'down': return 'trending-down-outline';
      default: return 'stats-chart-outline';
    }
  }

  getTrendColor(trend: string): string {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'danger';
      default: return 'medium';
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  getMembershipStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'danger';
      default: return 'medium';
    }
  }

  getAttendanceByDate(): { [key: string]: Attendance[] } {
    const grouped: { [key: string]: Attendance[] } = {};
    
    this.filteredAttendance.forEach(record => {
      const dateKey = this.formatDate(record.date);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(record);
    });

    // Sort dates in descending order
    const sortedGrouped: { [key: string]: Attendance[] } = {};
    Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .forEach(key => {
        sortedGrouped[key] = grouped[key].sort((a, b) => 
          new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
        );
      });

    return sortedGrouped;
  }
}
