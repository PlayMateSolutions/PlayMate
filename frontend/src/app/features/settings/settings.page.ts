import {
  Component,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  ElementRef,
} from '@angular/core';
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
import '@googleworkspace/drive-picker-element';
import { environment } from 'src/environments/environment';
import { Spreadsheet } from 'src/app/shared/interfaces/spreadsheet.interface';

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
  selectedSpreadsheet: Spreadsheet | null = null;
  hasChanges: boolean = false;
  loading: boolean = false; // Indicates API call loading state
  darkMode: boolean = false;
  language: string = 'en';
  userEmail: string = '';
  userName: string = '';
  userPicture: string = '';

  public pickerVisible = false;

  public clientId = environment.googleSignInClientId;
  public appId = environment.googleProjectNumber;
  public oauthToken = 'test';

  @ViewChild('drivePickerElement') drivePickerElement!: ElementRef<any>;

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
    this.selectedSpreadsheet = this.clubContext.getSpreadSheet();

    // Load user info
    this.loadUserInfo();
    addIcons({ saveOutline });
  }

  async ngAfterViewInit() {
    var session = await this.authService.getSession();
    this.oauthToken = session?.accessToken || '';

    const currentSheet = this.clubContext.getSpreadSheet();
    if (currentSheet) {
      this.pickerVisible = false;
      console.log('Current Spreadsheet:', currentSheet);
      return;
    }

    // const pickerEl = document.querySelector<any>("drive-picker");
    // if (pickerEl) {
    //   pickerEl.visible = true;
    //   console.log('Drive Picker initialized:', pickerEl);

    //   pickerEl.addEventListener("picker:picked", (event: any) => {
    //     console.log("Document picked:", event);
    //     const selectedDoc = event.detail.docs[0];
    //     this.clubContext.setSpreadSheet(selectedDoc)
    //   });

    //   pickerEl.addEventListener("picker:canceled", (event: any) => {
    //     console.log("Picker cancelled:", event);
    //   });
    // }
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
    this.hasChanges = true;
  }

  async logout() {
    const confirmed = window.confirm(
      'Are you sure you want to logout? This will delete all your local GymMate data.'
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

  openPicker() {
    if (this.drivePickerElement && this.drivePickerElement.nativeElement) {
      this.drivePickerElement.nativeElement.visible = true;
    } else {
      console.error('Drive Picker element not found');
    }
  }

  toSpreadsheet(raw: any): Spreadsheet {
    return {
      description: raw.description ?? '',
      driveSuccess: raw.driveSuccess ?? true,
      embedUrl: raw.embedUrl ?? '',
      iconUrl: raw.iconUrl ?? '',
      id: raw.id ?? '',
      isShared: raw.isShared ?? false,
      lastEditedUtc: raw.lastEditedUtc ?? 0,
      mimeType: raw.mimeType ?? '',
      name: raw.name ?? '',
      serviceId: raw.serviceId ?? '',
      sizeBytes: raw.sizeBytes ?? 0,
      type: raw.type ?? '',
      url: raw.url ?? '',
    };
  }

  onDrivePicked(event: any) {
    console.log('Drive document picked event:', event);
    const selectedDoc = event.detail.docs[0];
    var spreadsheet = this.toSpreadsheet(selectedDoc);
    this.clubContext.setSpreadSheet(spreadsheet);
    console.log('Selected Spreadsheet:', spreadsheet);
  }
}
