import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Welcome to PlayMate</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="login-container">
            <div class="intro-text">Please sign in with your Google account to continue</div>
            <div id="googleButton"></div>
            <div class="scope-info">
              This app requires access to:
              <ul>
                <li>Google Sheets</li>
                <li>Your email address</li>
              </ul>
            </div>
            <div *ngIf="error" class="error-message">
              {{ error }}
            </div>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      text-align: center;
    }

    #googleButton {
      margin: 20px 0;
    }

    .scope-info {
      margin-top: 20px;
      color: var(--ion-color-medium);
      font-size: 0.9em;
      text-align: left;
    }

    .scope-info ul {
      margin: 8px 0;
      padding-left: 20px;
    }

    .intro-text {
      color: var(--ion-color-dark);
      margin-bottom: 8px;
    }

    .error-message {
      color: var(--ion-color-danger);
      margin-top: 16px;
      font-size: 14px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon
  ]
})
export class LoginPage implements OnInit {
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private zone: NgZone,
    private toastController: ToastController
  ) {
    addIcons({ logoGoogle });
  }

  async ngOnInit() {
    try {
      await this.initializeGoogleSignIn();
    } catch (error) {
      console.error('Google Sign-In initialization failed:', error);
      this.error = 'Failed to initialize Google Sign-In. Please try again later.';
    }
  }

  private async initializeGoogleSignIn() {
    if (!google?.accounts?.id) {
      this.error = 'Google Sign-In SDK not loaded. Please check your internet connection and try again.';
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      scope: 'https://spreadsheets.google.com/feeds https://www.googleapis.com/auth/userinfo.email',
      callback: (response: any) => {
        this.zone.run(() => this.handleGoogleSignIn(response));
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });

    this.renderGoogleButton();
  }

  private renderGoogleButton() {
    const buttonElement = document.getElementById('googleButton');
    if (buttonElement) {
      google.accounts.id.renderButton(buttonElement, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 280,
        text: 'continue_with',
        shape: 'rectangular'
      });
    }
  }

  private async handleGoogleSignIn(response: any) {
    try {
      if (response?.credential) {
        const success = await this.authService.handleGoogleSignIn(response);
        if (success) {
          await this.router.navigate(['/tabs']);
        } else {
          throw new Error('Authentication failed');
        }
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      this.error = 'Authentication failed. Please ensure you grant all required permissions.';
      await this.showErrorToast('Authentication failed. Please try again.');
    }
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  }
}
