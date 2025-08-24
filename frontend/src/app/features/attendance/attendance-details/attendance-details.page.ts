import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSearchbar,
  IonIcon,
  IonBadge,
  IonNote,
  InfiniteScrollCustomEvent
} from '@ionic/angular/standalone';
import { AttendanceDB } from '../services/attendance-db';
import { Attendance } from '../../../shared/interfaces/attendance.interface';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { listOutline } from 'ionicons/icons';

@Component({
  selector: 'app-attendance-details',
  templateUrl: './attendance-details.page.html',
  styleUrls: ['./attendance-details.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonText,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonSpinner,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSearchbar,
    IonIcon,
    IonBadge,
    IonNote
  ]
})
export class AttendanceDetailsPage implements OnInit {
  loading = true;
  periodLabel: string = '';
  period: string = '';
  scrollToDate: string = '';
  searchQuery = '';
  startDate: string = '';
  endDate: string = '';
  attendanceRecords: Attendance[] = [];
  filteredRecords: Attendance[] = [];
  groupedRecords: { [date: string]: Attendance[] } = {};
  displayedGroups: { date: string, records: any[] }[] = [];
  currentPage = 1;
  recordsPerPage = 20;

  constructor(private route: ActivatedRoute) {
    // Add required icons
    addIcons({
      listOutline
    });
  }

  ngOnInit() {
    // Get query parameters
    this.route.queryParams.subscribe(params => {
      this.periodLabel = params['periodLabel'] || '';
      this.period = params['period'] || '';
      this.startDate = params['startDate'] || '';
      this.endDate = params['endDate'] || '';
      this.scrollToDate = params['scrollToDate'] || '';
      this.searchQuery = params['searchQuery'] || '';
      this.loadAttendanceData();
    });
  }

  async loadAttendanceData() {
    try {
      this.loading = true;
      // Always load all attendance records
      const allRecords = await AttendanceDB.getAll();
      this.attendanceRecords = allRecords;
      
      // Apply all filters (date range and search)
      this.applyFilter();
      
      // Reset pagination
      this.currentPage = 1;
      this.loadCurrentPage();
      
      // Scroll to date if provided
      setTimeout(() => this.scrollToActiveDate(), 100);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      this.attendanceRecords = [];
      this.filteredRecords = [];
      this.groupedRecords = {};
      this.displayedGroups = [];
    } finally {
      this.loading = false;
    }
  }
  
  applyFilter() {
    // Start with all records
    let filtered = [...this.attendanceRecords];
    
    // 1. Apply date range filter if startDate and endDate are provided
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999); // End of day
      
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      });
      console.log(`Filtered records by date range (${this.startDate} to ${this.endDate}):`, filtered.length);
    }
    
    // Save to filteredRecords after date filtering
    this.filteredRecords = [...filtered];
    
    // 2. Apply search filter if any
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        (record.memberName && record.memberName.toLowerCase().includes(query)) ||
        (record.notes && record.notes.toLowerCase().includes(query))
      );
    }
    
    // 3. Group filtered records by date
    this.groupRecordsByDate(filtered);
  }
  
  onSearchChange(event: any) {
    this.searchQuery = event.detail.value;
    this.applyFilter();
    this.currentPage = 1;
    this.loadCurrentPage();
  }
  
  loadCurrentPage() {
    // Paginate grouped records
    const dateKeys = Object.keys(this.groupedRecords).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const startIndex = (this.currentPage - 1) * this.recordsPerPage;
    const endIndex = startIndex + this.recordsPerPage;
    const pageDates = dateKeys.slice(startIndex, endIndex);
    this.displayedGroups = pageDates.map(dateKey => {
      const records = this.groupedRecords[dateKey].map(record => {
        const date = new Date(record.date);
        const formattedDate = date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        let time = 'Not recorded';
        if (record.checkInTime) {
          const checkInTime = new Date(record.checkInTime);
          time = checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (record.date) {
          time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        return { ...record, formattedDate, time };
      });
      return { date: dateKey, records };
    });
  }
  
  loadMoreRecords(event: InfiniteScrollCustomEvent) {
    // Check if there are more date groups to load
    const totalPages = Math.ceil(Object.keys(this.groupedRecords).length / this.recordsPerPage);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.loadCurrentPage();
      event.target.complete();
    } else {
      event.target.complete();
      event.target.disabled = true;
    }
  }

  groupRecordsByDate(records?: Attendance[]) {
    this.groupedRecords = {};
    const recordsToGroup = records || this.attendanceRecords;
    
    recordsToGroup.forEach(record => {
      const dateKey = new Date(record.date).toISOString().split('T')[0];
      if (!this.groupedRecords[dateKey]) this.groupedRecords[dateKey] = [];
      this.groupedRecords[dateKey].push(record);
    });
  }

  scrollToActiveDate() {
    if (!this.scrollToDate) return;
    try {
      // Try to find the element with id = scrollToDate
      const el = document.getElementById(this.scrollToDate);
      if (el) {
        // Scroll to the element if found
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // If the element is not found, get the IonContent reference
        const content = document.querySelector('ion-content');
        if (content) {
          // Scroll to the bottom of IonContent
          content.scrollToBottom(300); // 300ms animation
        }
      }
    } catch (error) {
      console.error('Error scrolling:', error);
    }
  }
}
