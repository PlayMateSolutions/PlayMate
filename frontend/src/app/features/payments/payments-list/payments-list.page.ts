import { Component, OnInit } from '@angular/core';
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
  IonCard,
  IonCardContent,
  IonBadge,
  IonNote,
  IonButtons,
  IonBackButton,
  IonSearchbar,
  IonItemDivider,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonButton
} from '@ionic/angular/standalone';
import { PaymentService } from '../payment.service';
import { ExpenseService } from '../expense.service';
import { Payment, PaymentGroup } from '../payment.interface';
import { Expense } from '../expense.interface';
import { addIcons } from 'ionicons';
import { searchOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-payments-list',
  templateUrl: './payments-list.page.html',
  styleUrls: ['./payments-list.page.scss'],
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
    IonCard,
    IonCardContent,
    IonBadge,
    IonNote,
    IonButtons,
    IonBackButton,
    IonSearchbar,
    IonItemDivider,
    IonSegment,
    IonSegmentButton,
    IonIcon,
    IonButton
  ]
})
export class PaymentsListPage implements OnInit {
  // Observable for loading state
  loading$ = this.paymentService.loading$;
  // Displayed payment groups (by month)
  displayedGroups: PaymentGroup[] = [];
  // Current search query
  searchQuery = '';
  // Selected segment for control
  selectedSegment: 'payments' | 'expenses' = 'payments';
  // Expenses array
  expenses: Expense[] = [];
  // Grouped expenses by month
  expenseGroups: {
    month: string;
    formattedDate: string;
    expenses: Expense[];
    total: number;
  }[] = [];

  // Show/hide searchbar
  isSearchVisible = false;

  constructor(private paymentService: PaymentService, private expenseService: ExpenseService) {}

  ngOnInit() {
    // Payments
    this.paymentService.payments$.subscribe(payments => {
      if (payments) {
        this.processPayments(payments);
      }
    });
    // Expenses
    this.expenseService.expenses$.subscribe(expenses => {
      this.expenses = expenses;
      this.processExpenses(expenses);
    });
    this.expenseService.loadData();

    addIcons({ searchOutline, closeOutline });
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
   * Groups expenses by month and updates expenseGroups
   */
  private processExpenses(expenses: Expense[]) {
    const groups = new Map<string, { month: string; formattedDate: string; expenses: Expense[]; total: number }>();
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
      if (!groups.has(monthKey)) {
        groups.set(monthKey, {
          month: monthKey,
          formattedDate: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          expenses: [],
          total: 0
        });
      }
      const group = groups.get(monthKey)!;
      group.expenses.push(expense);
      group.total += expense.amount;
    });
    // Sort expenses within each group by date descending
    groups.forEach(group => {
      group.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    this.expenseGroups = Array.from(groups.values())
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

  /**
   * Toggles the visibility of the search bar
   */
  toggleSearch() {
    this.isSearchVisible = !this.isSearchVisible;
    if (!this.isSearchVisible) {
      this.searchQuery = '';
      this.paymentService.payments$.subscribe(payments => {
        if (payments) {
          this.processPayments(payments);
        }
      });
    }
  }
}
