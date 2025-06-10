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
            <p>Please sign in to continue</p>
            <div id="googleButton"></div>
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
      margin-top: 20px;
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
        theme: 'outline',
        size: 'large',
        width: 250,
        text: 'continue_with'
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
      this.error = 'Authentication failed. Please try again.';
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
