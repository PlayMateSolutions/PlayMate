import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonBackButton, IonTitle, IonContent, IonCard, IonCardContent, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonNote, IonIcon } from '@ionic/angular/standalone';
import { MemberService } from '../services/member.service';
import { Member } from '../../../shared/interfaces/member.interface';
import { CalendarGridComponent } from '../../../shared/components/calendar-grid.component';
import { AttendanceService } from '../../attendance/services/attendance.service';
import { PaymentService } from '../../payments/payment.service';
import { Payment } from '../../payments/payment.interface';
import { Subscription } from 'rxjs';
import { normalizePhoneNumber } from 'src/app/shared/utils/phone-utils';
import { callOutline, logoWhatsapp } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonBackButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonNote,
    CalendarGridComponent
  ]
})
export class MemberDetailPage implements OnInit, OnDestroy {
  member: Member | null = null;
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  attendanceDates: string[] = [];
  selectedTab: 'attendance' | 'payments' = 'attendance';
  payments: Payment[] = [];
  paymentDates: string[] = [];
  private paymentSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private memberService: MemberService,
    private attendanceService: AttendanceService,
    private paymentService: PaymentService
  ) {
    addIcons({ callOutline, logoWhatsapp });
  }

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
      this.paymentSub = this.paymentService.getPaymentsByMember(memberId).subscribe(payments => {
        this.payments = payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.paymentDates = payments.map(p => new Date(p.date).toISOString().slice(0, 10));
      });
    }
  }

  ngOnDestroy() {
    if (this.paymentSub) this.paymentSub.unsubscribe();
  }

  onTabChange(event: any) {
    this.selectedTab = event.detail.value;
  }

  getAvatarColor(letter: string): string {
    if (!letter || !/^[A-Za-z]$/.test(letter)) return '#888'; // fallback gray
    const index = letter.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
    if (index < 0 || index > 25) return '#888';
    const hue = (index * (360 / 26)) % 360;
    const saturation = 50; // percent
    const lightness = 60; // percent
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  openWhatsApp(phone: string | null) {
    if (phone) {
      const url = `https://wa.me/${normalizePhoneNumber(phone)}`;
      window.open(url, '_blank');
    }
  }

  callMember(phone: string | null) {
    if (phone) {
      const url = `tel:${normalizePhoneNumber(phone)}`;
      window.open(url, '_blank');
    }
  }
}
