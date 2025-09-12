import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonInput, IonItem, IonLabel, IonDatetime, IonTextarea, IonPopover, IonList, IonContent, IonButtons, IonHeader, IonToolbar, IonTitle, IonSpinner, ModalController } from '@ionic/angular/standalone';
import { Expense } from './expense.interface';
import { ExpenseService } from './expense.service';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
  styleUrls: ['./expense-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonInput, IonItem, IonLabel, IonDatetime, IonTextarea, IonPopover, IonList, IonContent, IonButtons, IonHeader, IonToolbar, IonTitle, IonSpinner],
  providers: [ExpenseService]
})
export class ExpenseModalComponent {
  @Input() currentUser: string = '';
  expense: Partial<Expense> = {
    date: new Date().toISOString(),
    paymentType: 'Cash',
    recordedBy: ''
  };
  saving = false;
  errorMsg = '';

  constructor(private modalCtrl: ModalController, private expenseService: ExpenseService) {
    console.log('ExpenseModalComponent initialized with currentUser:', this.currentUser);
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async save() {
    if (!this.expense.amount || !this.expense.category) return;
    this.saving = true;
    this.errorMsg = '';
    this.expense.recordedBy = this.currentUser;
    try {
      await this.expenseService.addExpense(this.expense);
      await this.modalCtrl.dismiss({ expense: this.expense });
    } catch (err) {
      this.errorMsg = 'Failed to record expense. Please try again.';
    } finally {
      this.saving = false;
    }
  }
}
