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
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
  IonSearchbar,
  IonBadge,
  IonNote,
  IonButtons,
  IonMenuButton,
  IonSkeletonText,
  IonItemDivider,

  IonButton,
  IonIcon,
  ToastController
} from '@ionic/angular/standalone';
import { PaymentService } from './payment.service';
import { Payment, PaymentSummary, PaymentGroup } from './payment.interface';
import { addIcons } from 'ionicons';
import { refresh } from 'ionicons/icons';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
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
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonCardSubtitle,
    IonSearchbar,
    IonBadge,
    IonNote,
    IonButtons,
    IonMenuButton,
    IonSkeletonText,
    IonItemDivider,
    IonButton,
    IonIcon
  ]
})
export class PaymentsPage implements OnInit {
  loading$ = this.paymentService.loading$;
  summary$ = this.paymentService.summary$;
  displayedGroups: PaymentGroup[] = [];
  searchQuery = '';

  constructor(
    private paymentService: PaymentService,
    private toastController: ToastController
  ) {
    addIcons({ refresh });
  }

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

  refreshing = false;

  async refreshPayments() {
    if (this.refreshing) return;
    
    try {
      this.refreshing = true;
      console.log('Refreshing payment data...');
      
      await this.paymentService.loadData();
      
      console.log('Payment data refreshed successfully');
      const toast = await this.toastController.create({
        message: 'Payment data refreshed successfully',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      
    } catch (error) {
      console.error('Error refreshing payment data:', error);
      const toast = await this.toastController.create({
        message: 'Failed to refresh payment data',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      
    } finally {
      this.refreshing = false;
    }
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value?.toLowerCase() || '';
    // TODO: Implement search functionality
  }

  showPaymentDetails(payment: Payment) {
    // TODO: Navigate to payment details page
    console.log('Show payment details:', payment);
  }
}
