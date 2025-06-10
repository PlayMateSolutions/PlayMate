import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  PopoverController 
} from '@ionic/angular/standalone';
import { AuthService, UserSession } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-menu',
  template: `
    <ion-list>
      <ion-item *ngIf="userSession$ | async as session">
        <ion-label>
          <h2>{{ session.name }}</h2>
          <p>{{ session.email }}</p>
        </ion-label>
      </ion-item>
      <ion-item button (click)="logout()">
        <ion-icon slot="start" name="log-out-outline"></ion-icon>
        <ion-label>Logout</ion-label>
      </ion-item>
    </ion-list>
  `,
  styles: [`
    ion-list {
      margin: 0;
      padding: 0;
    }
    h2 {
      font-weight: 500;
      margin: 0;
    }
    p {
      margin: 4px 0 0;
      color: var(--ion-color-medium);
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonIcon
  ]
})
export class ProfileMenuComponent {
  userSession$ = this.authService.userSession$;

  constructor(
    private authService: AuthService,
    private popoverController: PopoverController
  ) {}

  logout() {
    this.popoverController.dismiss(null, 'logout');
  }
}
