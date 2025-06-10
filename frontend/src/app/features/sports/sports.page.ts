import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sports',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Sports</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="addSport()">
            <ion-icon slot="icon-only" name="add"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <!-- Sports list will go here -->
        <ion-item>
          <ion-label>
            <h2>Coming Soon</h2>
            <p>Sports management features are under development</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class SportsPage {
  addSport() {
    // TODO: Implement sport addition
  }
}
