import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonInput, IonItem, IonLabel, IonDatetime, IonTextarea, IonPopover, IonList, IonContent, IonButtons, IonHeader, IonToolbar, IonTitle, ModalController } from '@ionic/angular/standalone';
import { Expense } from './expense.interface';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
  styleUrls: ['./expense-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonInput, IonItem, IonLabel, IonDatetime, IonTextarea, IonPopover, IonList, IonContent, IonButtons, IonHeader, IonToolbar, IonTitle]
})
export class ExpenseModalComponent {
  @Input() currentUser: string = '';
  expense: Partial<Expense> = {
    date: new Date().toISOString(),
    paymentType: 'Cash',
    recordedBy: ''
  };
  saving = false;

  constructor(private modalCtrl: ModalController) {
    console.log('ExpenseModalComponent initialized with currentUser:', this.currentUser);
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async save() {
    if (!this.expense.amount || !this.expense.category) return;
    this.saving = true;
    this.expense.recordedBy = this.currentUser;
    await this.modalCtrl.dismiss({ expense: this.expense });
    this.saving = false;
  }
}
