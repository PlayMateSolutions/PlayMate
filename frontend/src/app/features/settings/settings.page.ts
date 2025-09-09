import { Component, OnInit } from '@angular/core';
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
  IonAvatar
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubContextService } from '../../core/services/club-context.service';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: true,
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
    IonAvatar
  ]
})
export class SettingsPage implements OnInit {
  sportsClubId: string = '';
  hasChanges: boolean = false;
  darkMode: boolean = false;
  language: string = 'en';
  userEmail: string = '';
  userName: string = '';
  userPicture: string = '';

  constructor(
    private clubContext: ClubContextService,
    private toastCtrl: ToastController,
    private router: Router,
    private authService: AuthService
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
  }

  loadUserInfo() {
    this.authService.userSession$.subscribe(session => {
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
    if (this.sportsClubId.trim()) {
      this.clubContext.setSportsClubId(this.sportsClubId.trim());
      const toast = await this.toastCtrl.create({
        message: 'Settings saved successfully!',
        duration: 1500,
        color: 'success'
      });
      await toast.present();
      this.hasChanges = false;
    } else {
      const toast = await this.toastCtrl.create({
        message: 'Please enter a valid Sports Club ID.',
        duration: 1500,
        color: 'danger'
      });
      toast.present();
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
    try {
      // Clear auth session
      await this.authService.logout();

      // Clear local storage
      // localStorage.clear();

      // Clear IndexedDB members database
      const request = window.indexedDB.deleteDatabase('members');
      request.onsuccess = () => {
        console.log('Members database deleted successfully');
      };
      request.onerror = () => {
        console.error('Error deleting members database');
      };

      // Clear club context
      // this.clubContext.clear();

      // Navigate to login page
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Logout error:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error during logout. Please try again.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
