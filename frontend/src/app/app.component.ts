import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ClubContextService } from './core/services/club-context.service';
import { IonApp, IonRouterOutlet, IonAvatar, IonIcon, IonButton, IonButtons } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
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
    HttpClientModule
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
    // Read sportsClubId from query params and store in ClubContextService
    this.route.queryParams.subscribe(async params => {
      const clubId = params['sportsClubId'];
      if (clubId) {
        this.clubContext.setSportsClubId(clubId);
      }
      // If not set, redirect to settings
      if (!this.clubContext.getSportsClubId()) {
        await this.router.navigate(['/settings']);
      }
    });
    try {
      await SocialLogin.initialize({
        google: {
          webClientId: environment.googleSignInClientId,
        },
      });
    } catch (error) {
      console.error('Failed to initialize Social Login:', error);
    }
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
