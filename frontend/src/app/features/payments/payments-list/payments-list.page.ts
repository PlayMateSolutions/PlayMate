import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList,
  IonItem, 
  IonLabel, 
  IonCard,
  IonCardContent,
  IonBadge,
  IonNote,
  IonButtons,
  IonBackButton,
  IonSearchbar,
  IonItemDivider,
} from '@ionic/angular/standalone';
import { PaymentService } from '../payment.service';
import { Payment, PaymentGroup } from '../payment.interface';

@Component({
  selector: 'app-payments-list',
  templateUrl: './payments-list.page.html',
  styleUrls: ['./payments-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardContent,
    IonBadge,
    IonNote,
    IonButtons,
    IonBackButton,
    IonSearchbar,
    IonItemDivider,
  ]
})
export class PaymentsListPage implements OnInit {
  // Observable for loading state
  loading$ = this.paymentService.loading$;
  // Displayed payment groups (by month)
  displayedGroups: PaymentGroup[] = [];
  // Current search query
  searchQuery = '';

  constructor(private paymentService: PaymentService) {}

  ngOnInit() {
    // Subscribe to payments stream
    this.paymentService.payments$.subscribe(payments => {
      if (payments) {
        this.processPayments(payments);
      }
    });

    // Initial load
    this.paymentService.loadData().catch(error => {
      console.error('Error initializing payments:', error);
    });
  }

  /**
   * Groups payments by month and updates displayedGroups
   */
  private processPayments(payments: Payment[]) {
    const groups = new Map<string, PaymentGroup>();
    payments.forEach(payment => {
      const date = new Date(payment.date);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
      if (!groups.has(monthKey)) {
        groups.set(monthKey, {
          month: monthKey,
          formattedDate: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          payments: [],
          total: 0
        });
      }
      const group = groups.get(monthKey)!;
      group.payments.push(payment);
      group.total += payment.amount;
    });
    // Sort payments within each group by date descending (latest first)
    groups.forEach(group => {
      group.payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    this.displayedGroups = Array.from(groups.values())
      .sort((a, b) => b.month.localeCompare(a.month));
  }

  /**
   * Handles search input and filters payments
   */
  onSearchChange(event: any) {
    this.searchQuery = event.detail.value?.toLowerCase() || '';
    this.paymentService.payments$.subscribe(payments => {
      if (payments) {
        const filteredPayments = payments.filter(payment => 
          payment.memberName?.toLowerCase().includes(this.searchQuery) ||
          payment.memberId.toLowerCase().includes(this.searchQuery) ||
          payment.paymentType.toLowerCase().includes(this.searchQuery)
        );
        this.processPayments(filteredPayments);
      }
    });
  }

  /**
   * Shows payment details (to be implemented)
   */
  showPaymentDetails(payment: Payment) {
    // TODO: Show payment details modal or navigate to details page
    console.log('Show payment details:', payment);
  }
}
