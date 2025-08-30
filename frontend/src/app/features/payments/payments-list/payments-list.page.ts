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
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/payments"></ion-back-button>
        </ion-buttons>
        <ion-title>Payment History</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Search payments"
          (ionInput)="onSearchChange($event)"
          [debounce]="500">
        </ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="payment-list" *ngIf="!(loading$ | async) && displayedGroups.length > 0">
        <div *ngFor="let group of displayedGroups" class="date-group">
          <ion-item-divider sticky="true" color="light">
            <ion-label>{{ group.formattedDate }}</ion-label>
            <ion-note slot="end">₹{{ group.total | number:'1.0-0' }}</ion-note>
          </ion-item-divider>
          
          <ion-list lines="full">
            <ion-item *ngFor="let payment of group.payments" class="payment-item" (click)="showPaymentDetails(payment)">
              <ion-label>
                <h2>{{ payment.memberName || 'Unknown Member' }}
                  <ion-note color="medium" class="id-note">#{{ payment.memberId }}</ion-note>
                </h2>
                <ion-note color="medium">
                  {{ payment.date | date:'mediumDate' }} · {{ payment.paymentType }}
                  <ion-badge *ngIf="payment.status !== 'active'" color="danger" class="status-badge">
                    {{ payment.status }}
                  </ion-badge>
                </ion-note>
              </ion-label>
              <ion-note slot="end" color="success" class="amount-note">
                ₹{{ payment.amount | number:'1.0-0' }}
              </ion-note>
            </ion-item>
          </ion-list>
        </div>
      </div>

      <!-- No Payments Message -->
      <ion-card *ngIf="!(loading$ | async) && displayedGroups.length === 0" class="no-data-card">
        <ion-card-content class="ion-text-center">
          <ion-label color="medium">
            <h2>No Payments Found</h2>
            <p *ngIf="!searchQuery">There are no payment records.</p>
            <p *ngIf="searchQuery">No payments match your search criteria.</p>
          </ion-label>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .payment-list {
      margin-top: 1rem;
    }

    .date-group {
      ion-item-divider {
        --background: var(--ion-color-light);
        font-weight: 500;
      }
    }

    .payment-item {
      .id-note {
        font-size: 0.8em;
        margin-left: 0.5rem;
      }

      .amount-note {
        font-size: 1.1em;
        font-weight: 500;
      }

      .status-badge {
        margin-left: 0.5rem;
        font-size: 0.7em;
      }
    }

    .no-data-card {
      margin: 1rem;
      text-align: center;
      
      h2 {
        font-size: 1.2em;
        margin-bottom: 0.5rem;
      }
      
      p {
        color: var(--ion-color-medium);
      }
    }
  `],
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
  loading$ = this.paymentService.loading$;
  displayedGroups: PaymentGroup[] = [];
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

  private processPayments(payments: Payment[]) {
    // Group payments by month
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

    // Convert to array and sort by date (newest first)
    this.displayedGroups = Array.from(groups.values())
      .sort((a, b) => b.month.localeCompare(a.month));
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value?.toLowerCase() || '';
    // Filter payments based on search
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

  showPaymentDetails(payment: Payment) {
    // TODO: Show payment details modal or navigate to details page
    console.log('Show payment details:', payment);
  }
}
