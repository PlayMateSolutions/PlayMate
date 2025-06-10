import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payments',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Payments</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="recordPayment()">
            <ion-icon slot="icon-only" name="add"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <!-- Payment list will go here -->
        <ion-item>
          <ion-label>
            <h2>Coming Soon</h2>
            <p>Payment tracking features are under development</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class PaymentsPage {
  recordPayment() {
    // TODO: Implement payment recording
  }
}
