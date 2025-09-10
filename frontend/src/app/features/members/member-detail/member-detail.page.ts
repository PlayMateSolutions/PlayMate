import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { MemberService } from '../services/member.service';
import { Member } from '../../../shared/interfaces/member.interface';
import { CalendarGridComponent } from '../../../shared/components/calendar-grid.component';
import { AttendanceService } from '../../attendance/services/attendance.service';
import { Attendance } from '../../../shared/interfaces/attendance.interface';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    CalendarGridComponent
  ]
})
export class MemberDetailPage implements OnInit {
  member: Member | null = null;
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  attendanceDates: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private memberService: MemberService,
    private attendanceService: AttendanceService
  ) {}

  ngOnInit() {
    const memberId = this.route.snapshot.paramMap.get('id');
    if (memberId) {
      this.memberService.getMembers().subscribe(result => {
        this.member = result.members.find(m => String(m.id) === String(memberId)) || null;
      });
      this.attendanceService.getAttendanceByMember(memberId).subscribe(records => {
        this.attendanceDates = records.map(r => {
          const d = new Date(r.date);
          const iso = d.toISOString().slice(0, 10);
          return iso;
        });
      });
    }
  }
}
