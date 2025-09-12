import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  ToastController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonItemGroup,
  IonItemDivider,
  IonItem,
  IonLabel,
  IonInput,
  IonNote,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonAvatar,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubContextService } from '../../core/services/club-context.service';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PlayMateDB } from '../../core/services/playmate-db';
import { ApiService } from '../../core/services/api.service';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItemGroup,
    IonItemDivider,
    IonItem,
    IonLabel,
    IonInput,
    IonNote,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonAvatar,
  ],
})
export class SettingsPage implements OnInit {
  sportsClubId: string = '';
  hasChanges: boolean = false;
  loading: boolean = false; // Indicates API call loading state
  darkMode: boolean = false;
  language: string = 'en';
  userEmail: string = '';
  userName: string = '';
  userPicture: string = '';

  constructor(
    private clubContext: ClubContextService,
    private toastCtrl: ToastController,
    private router: Router,
    private authService: AuthService,
    private apiService: ApiService
  ) {
    // Get the stored theme preference or system preference
    this.darkMode = document.body.classList.contains('dark-theme');
    // Get stored language preference
    this.language = localStorage.getItem('language') || 'en';
  }

  ngOnInit() {
    // Load Sports Club ID
    const storedClubId = this.clubContext.getSportsClubId();
    this.sportsClubId = storedClubId || '';

    // Load user info
    this.loadUserInfo();
    addIcons({ saveOutline });
  }

  loadUserInfo() {
    this.authService.userSession$.subscribe((session) => {
      if (session) {
        this.userEmail = session.email;
        this.userName = session.name;
        this.userPicture = session.picture || '';
      }
    });
  }

  settingsChanged() {
    this.hasChanges = true;
  }

  async saveSettings() {
    this.loading = true;
    const trimmedClubId = this.sportsClubId.trim();
    const currentClubId = this.clubContext.getSportsClubId() || '';
    if (trimmedClubId) {
      // Only validate with server if club ID has changed
      if (trimmedClubId !== currentClubId) {
        try {
          const response = await this.apiService.get<any>(
            'getSportsClubById',
            trimmedClubId
          );
          console.log('Club ID validation response:', response);
          if (
            response.status === 'success' &&
            response.data &&
            response.data.active
          ) {
            this.clubContext.setSportsClubId(trimmedClubId);
            const toast = await this.toastCtrl.create({
              message: 'Settings saved successfully!',
              duration: 1500,
              color: 'success',
            });
            await toast.present();
            this.hasChanges = false;
          } else {
            const toast = await this.toastCtrl.create({
              message: 'Invalid or inactive Sports Club ID.',
              duration: 1500,
              color: 'danger',
            });
            await toast.present();
          }
        } catch (err) {
          console.error('Error validating club ID:', err);
          const toast = await this.toastCtrl.create({
            message: 'Failed to validate Sports Club ID. Please try again.',
            duration: 1500,
            color: 'danger',
          });
          await toast.present();
        } finally {
          this.loading = false;
        }
      } else {
        // No change, just save
        this.clubContext.setSportsClubId(trimmedClubId);
        const toast = await this.toastCtrl.create({
          message: 'Settings saved successfully!',
          duration: 1500,
          color: 'success',
        });
        await toast.present();
        this.hasChanges = false;
        this.loading = false;
      }
    } else {
      const toast = await this.toastCtrl.create({
        message: 'Please enter a valid Sports Club ID.',
        duration: 1500,
        color: 'danger',
      });
      toast.present();
      this.loading = false;
    }
  }

  toggleDarkMode() {
    document.body.classList.toggle('dark-theme', this.darkMode);
    this.clubContext.setDarkMode(this.darkMode);
  }

  changeLanguage() {
    this.clubContext.setLanguage(this.language);
    // You can add translation logic here
  }

  async logout() {
    const confirmed = window.confirm(
      'Are you sure you want to logout? This will delete all your local PlayMate data.'
    );
    if (!confirmed) return;
    try {
      // Clear auth session
      await this.authService.logout();

      // Delete PlayMateDB IndexedDB
      try {
        await PlayMateDB.deleteDatabase();
        console.log('PlayMateDB deleted successfully');
      } catch (err) {
        console.error('Error deleting PlayMateDB:', err);
      }

      // Optionally clear club context
      this.clubContext.clear();

      // Navigate to login page
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Logout error:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error during logout. Please try again.',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
    }
  }
}
