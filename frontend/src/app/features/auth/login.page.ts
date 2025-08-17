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
import { ClubContextService } from '../../core/services/club-context.service';
import { addIcons } from 'ionicons';
import { logoGoogle, personCircleOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
    private toastController: ToastController,
    private clubContext: ClubContextService
  ) {
    addIcons({ 
      logoGoogle,
      personCircleOutline 
    });
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
        // Check if club context is set, if not go to settings first
        if (this.clubContext.getSportsClubId()) {
          await this.router.navigate(['/tabs']);
        } else {
          await this.router.navigate(['/settings']);
        }
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
