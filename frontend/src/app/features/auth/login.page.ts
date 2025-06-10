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
  Platform,
  ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';
import { environment } from '../../../environments/environment';

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
            <ion-button (click)="handleGoogleSignIn()" expand="block">
              <ion-icon slot="start" name="logo-google"></ion-icon>
              Sign in with Google
            </ion-button>
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
      margin-bottom: 20px;
    }

    .error-message {
      color: var(--ion-color-danger);
      margin-top: 16px;
      font-size: 14px;
    }

    ion-button {
      margin: 20px 0;
      width: 250px;
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
    private platform: Platform,
    private zone: NgZone,
    private toastController: ToastController
  ) {
    addIcons({ logoGoogle });
  }

  async ngOnInit() {
    try {
            this.platform.ready().then(async () => {
      await this.initializeAuth();
            });
    } catch (error) {
      console.error('Login initialization failed:', error);
      this.error = 'Failed to initialize login. Please try again later.';
    }
  }

  private async initializeAuth() {
    const initialized = await this.authService.initGoogleAuth();
    if (!initialized) {
      this.error = 'Failed to initialize authentication. Please check your internet connection and try again.';
    }
  }

  async handleGoogleSignIn() {
    try {
      this.error = null;
      const success = await this.zone.run(() => this.authService.login());
      if (success) {
        await this.router.navigate(['/tabs']);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
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
