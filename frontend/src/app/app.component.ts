import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ClubContextService } from './core/services/club-context.service';
import { IonApp, IonRouterOutlet, IonAvatar, IonIcon, IonButton, IonButtons, MenuController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MenuComponent } from './core/components/menu.component';
import { RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy } from '@ionic/angular/standalone';
import { environment } from '../environments/environment';
import { HttpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { AuthService, UserSession } from './core/services/auth.service';
import { Observable } from 'rxjs';
import { addIcons } from 'ionicons';
import { personCircleOutline, logOutOutline } from 'ionicons/icons';
import { PopoverController } from '@ionic/angular/standalone';
import { ProfileMenuComponent } from './shared/components/profile-menu/profile-menu.component';
import { SocialLogin } from '@capgo/capacitor-social-login';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonApp,
    IonRouterOutlet,
    IonAvatar,
    IonIcon,
    IonButton,
    IonButtons,
    HttpClientModule,
    MenuComponent
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }
  ]
})
export class AppComponent implements OnInit {
  userSession$: Observable<UserSession | null>;


  constructor(
    private authService: AuthService,
    private router: Router,
    private popoverController: PopoverController,
    private route: ActivatedRoute,
    private clubContext: ClubContextService
  ) {
    addIcons({ personCircleOutline, logOutOutline });
    this.userSession$ = this.authService.userSession$;
  }

  async ngOnInit() {
    // Initialize Social Login
    try {
      await SocialLogin.initialize({
        google: {
          webClientId: environment.googleSignInClientId,
        },
      });
    } catch (error) {
      console.error('Failed to initialize Social Login:', error);
    }

    // Handle club context only after authentication is confirmed
    this.authService.isAuthenticated$.subscribe(async (isAuthenticated) => {
      if (isAuthenticated) {
        // Check current route to avoid unnecessary navigation
        const currentUrl = this.router.url;
        
        // Read sportsClubId from query params and store in ClubContextService
        this.route.queryParams.subscribe(async params => {
          const clubId = params['sportsClubId'];
          if (clubId) {
            this.clubContext.setSportsClubId(clubId);
          }
          
          // Only navigate if we're not already on the target page
          const existingClubId = this.clubContext.getSportsClubId();
          
          if (!existingClubId && !currentUrl.includes('/settings')) {
            // No club ID set and not on asettings page, go to settings
            await this.router.navigate(['/settings']);
          }
        });
      }
    });
  }

  async showProfileMenu(event: Event) {
    const popover = await this.popoverController.create({
      component: ProfileMenuComponent,
      event: event,
      translucent: true
    });
    
    await popover.present();

    const { role } = await popover.onWillDismiss();
    if (role === 'logout') {
      await this.authService.logout();
      await this.router.navigate(['/login']);
    }
  }
}
