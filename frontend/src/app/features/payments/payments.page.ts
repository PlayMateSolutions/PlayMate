import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonButtons,
  IonMenuButton,
  IonSkeletonText,
  IonButton,
  IonIcon,
  ToastController
} from '@ionic/angular/standalone';
import { PaymentService } from './payment.service';
import { Payment, PaymentSummary, PaymentGroup } from './payment.interface';
import { addIcons } from 'ionicons';
import { 
  refresh, 
  wallet, 
  calendar, 
  chevronForwardOutline 
} from 'ionicons/icons';

// Initialize icons
addIcons({ 
  refresh, 
  wallet, 
  calendar, 
  chevronForwardOutline 
});
import { GoogleChart, ChartType } from 'angular-google-charts';
import { ClubContextService } from '../../core/services/club-context.service';
import { RelativeTimePipe } from '../members/relative-time.pipe';
import { ExpenseService } from './expense.service';
import { Expense } from './expense.interface';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonButtons,
    IonMenuButton,
    IonSkeletonText,
    IonButton,
    IonIcon,
    GoogleChart,
    RelativeTimePipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PaymentsPage implements OnInit {
  loading$ = this.paymentService.loading$;
  summary$ = this.paymentService.summary$;
  displayedGroups: PaymentGroup[] = [];

  // Chart related properties
  chartType = ChartType.LineChart;
  chartColumns = ['Month', 'Amount', { type: 'string', role: 'tooltip' }];
  chartData: any[][] = [];
  chartOptions = {
    backgroundColor: 'transparent',
    colors: ['#2dd36f'], // success color
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
    },
    pointSize: 5,
    lineWidth: 2
  };
  
  currentMonthEarnings = 0;
  currentMonthPayments = 0;
  lastPaymentSync: Date | null = null;

  expenses: Expense[] = [];
  totalExpenses = 0;
  currentMonthExpenses = 0;
  currentMonthExpenseCount = 0;
  today = new Date();

  constructor(
    private paymentService: PaymentService,
    private toastController: ToastController,
    private clubContext: ClubContextService,
    private expenseService: ExpenseService
  ) {
    addIcons({ refresh });
    this.lastPaymentSync = this.clubContext.getLastPaymentRefresh();
  }

  private prepareChartData(summary: PaymentSummary | null) {
    if (!summary) {
      this.chartData = [];
      return;
    }

    // Convert monthBreakdown to array and sort by month
    const monthlyData = Object.entries(summary.monthBreakdown)
      .map(([month, data]) => ({
        month,
        amount: data.amount,
        count: data.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Create chart data array
    this.chartData = monthlyData.map(data => {
      const date = new Date(data.month + '-01');
      const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      return [
        monthName,
        data.amount,
        `${monthName}\nAmount: ₹${data.amount}\nPayments: ${data.count}`
      ];
    });
  }
  
  ngOnInit() {
    // Subscribe to payments stream
    this.paymentService.payments$.subscribe(payments => {
      if (payments) {
        this.processPayments(payments);
      }
    });

    // Subscribe to summary to update chart
    this.summary$.subscribe(summary => {
      this.prepareChartData(summary);
    });

    // Subscribe to expenses
    this.expenseService.expenses$.subscribe(expenses => {
      this.expenses = expenses;
      this.calculateExpenses();
    });

    // Load cached data for payments and expenses
    this.paymentService.loadData().catch(error => {
      console.error('Error initializing payments:', error);
    });
    this.expenseService.loadData().catch(error => {
      console.error('Error initializing expenses:', error);
    });
  }

  private processPayments(payments: Payment[]) {
    // Group payments by month
    const groups = new Map<string, PaymentGroup>();
    const currentMonth = new Date().toISOString().substring(0, 7);
    this.currentMonthEarnings = 0;
    this.currentMonthPayments = 0;
    
    payments.forEach(payment => {
      const date = new Date(payment.date);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
      
      // Track current month earnings
      if (monthKey === currentMonth) {
        this.currentMonthEarnings += payment.amount;
        this.currentMonthPayments++;
      }
      
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

  private calculateExpenses() {
    const currentMonth = new Date().toISOString().substring(0, 7);
    this.totalExpenses = 0;
    this.currentMonthExpenses = 0;
    this.currentMonthExpenseCount = 0;
    this.expenses.forEach(exp => {
      this.totalExpenses += exp.amount;
      const monthKey = exp.date.substring(0, 7);
      if (monthKey === currentMonth) {
        this.currentMonthExpenses += exp.amount;
        this.currentMonthExpenseCount++;
      }
    });
  }

  refreshing = false;

  async refreshPayments() {
    if (this.refreshing) return;
    try {
      this.refreshing = true;
      console.log('Refreshing payment and expense data...');
      await Promise.all([
        this.paymentService.refreshData(),
        this.expenseService.refreshData()
      ]);
      this.lastPaymentSync = this.clubContext.getLastPaymentRefresh();
      console.log('Payment and expense data refreshed successfully');
      const toast = await this.toastController.create({
        message: 'Payment and expense data refreshed successfully',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error refreshing payment or expense data:', error);
      const toast = await this.toastController.create({
        message: 'Failed to refresh payment or expense data',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.refreshing = false;
    }
  }

  showPaymentDetails(payment: Payment) {
    // TODO: Navigate to payment details page
    console.log('Show payment details:', payment);
  }

  goToPaymentsList() {
    // Navigation handled by RouterLink
    console.log('Navigating to payments list...');
  }
}
