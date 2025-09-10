import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { 
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonItemDivider,
  MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, cashOutline, calendarOutline, settingsOutline } from 'ionicons/icons';

addIcons({ peopleOutline, cashOutline, calendarOutline, settingsOutline });

@Component({
  selector: 'app-menu',
  template: `
    <ion-menu contentId="main-content">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>PlayMate</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item (click)="navigate('/tabs/members')" button detail>
            <ion-icon slot="start" name="people-outline"></ion-icon>
            <ion-label>Members</ion-label>
          </ion-item>
          <ion-item (click)="navigate('/tabs/payments')" button detail>
            <ion-icon slot="start" name="cash-outline"></ion-icon>
            <ion-label>Payments</ion-label>
          </ion-item>
          <ion-item (click)="navigate('/tabs/attendance')" button detail>
            <ion-icon slot="start" name="calendar-outline"></ion-icon>
            <ion-label>Attendance</ion-label>
          </ion-item>
          <ion-item-divider>
            <ion-label>Admin</ion-label>
          </ion-item-divider>
          <ion-item (click)="navigate('/settings')" button detail>
            <ion-icon slot="start" name="settings-outline"></ion-icon>
            <ion-label>Settings</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>
  `,
  standalone: true,
  imports: [
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonItemDivider
  ]
})
export class MenuComponent {
  constructor(
    private router: Router,
    private menu: MenuController
  ) {}

  async navigate(path: string) {
    await this.menu.close();
    await this.router.navigate([path]);
  }
}
