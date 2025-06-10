import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item>
          <ion-label>
            <h2>API Token</h2>
            <p>Configure API access token</p>
          </ion-label>
        </ion-item>
        <ion-item>
          <ion-label>
            <h2>Theme</h2>
            <p>Light/Dark mode settings</p>
          </ion-label>
        </ion-item>
        <ion-item button (click)="logout()">
          <ion-icon slot="start" name="log-out"></ion-icon>
          <ion-label>Logout</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class SettingsPage {
  logout() {
    // TODO: Implement logout
  }
}
