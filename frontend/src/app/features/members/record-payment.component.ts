import { Component, Input } from '@angular/core';
import { 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonTextarea,
  ModalController,
  IonButtons,
  IonButton,
  IonText,
  IonPopover,
  LoadingController
} from '@ionic/angular/standalone';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Member } from '../../shared/interfaces/member.interface';
import { CommonModule } from '@angular/common';
import { PaymentService } from './services/payment.service';

@Component({
  selector: 'app-record-payment',
  templateUrl: './record-payment.component.html',
  styleUrls: ['./record-payment.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonTextarea,
    IonButtons,
    IonText,
    IonPopover
  ]
})
export class RecordPaymentComponent {
  @Input() member!: Member;

  payment = {
    memberId: '', // Keep as memberId since that's what backend expects
    date: new Date().toISOString(),
    amount: 500,
    paymentType: 'Cash' as const,
    periodStart: new Date().toISOString(),
    periodEnd: '',
    status: 'Paid' as const,
    notes: 'Monthly Fees'
  };

  constructor(
    private modalCtrl: ModalController,
    private paymentService: PaymentService,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.payment.memberId = this.member.id;
    
    // Set period start to first day of current month
    const startDate = new Date();
    startDate.setDate(1);
    this.payment.periodStart = startDate.toISOString();

    // Set period end to last day of selected month
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);
    this.payment.periodEnd = endDate.toISOString();
  }

  isValid(): boolean {
    return !!(
      this.payment.amount > 0 &&
      this.payment.date &&
      this.payment.periodStart &&
      this.payment.periodEnd &&
      this.payment.paymentType
    );
  }

  async recordPayment() {
    if (!this.isValid()) {
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Recording payment...',
    });
    await loading.present();

    try {
      const response = await this.paymentService.recordPayment(this.payment).toPromise();
      if (response?.status === 'success' && response.data) {
        await this.modalCtrl.dismiss({
          success: true,
          payment: this.payment,
          paymentId: response.data.paymentId,
          expiryDate: response.data.expiryDate
        });
      } else {
        throw new Error(response?.error?.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Payment recording failed:', error);
      // Don't dismiss the modal, let the user try again
    } finally {
      await loading.dismiss();
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
