import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attendance',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Attendance</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="recordAttendance()">
            <ion-icon slot="icon-only" name="add"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <!-- Attendance list will go here -->
        <ion-item>
          <ion-label>
            <h2>Coming Soon</h2>
            <p>Attendance tracking features are under development</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AttendancePage {
  recordAttendance() {
    // TODO: Implement attendance recording
  }
}
