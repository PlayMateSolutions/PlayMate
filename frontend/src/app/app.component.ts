import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ClubContextService } from './core/services/club-context.service';
import { IonApp, IonRouterOutlet, IonAvatar, IonIcon, IonButton, IonButtons, MenuController, IonLoading } from '@ionic/angular/standalone';
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
import { MemberService } from './features/members/services/member.service';
import { AttendanceService } from './features/attendance/services/attendance.service';
import { PaymentService } from './features/payments/payment.service';
import { AppRefresherService } from './core/services/app-refresher.service';

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
    MenuComponent,
    IonLoading
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }
  ]
})
export class AppComponent implements OnInit {
  userSession$: Observable<UserSession | null>;
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private popoverController: PopoverController,
    private route: ActivatedRoute,
    private clubContext: ClubContextService,
    // private memberService: MemberService,
    // private attendanceService: AttendanceService,
    // private paymentService: PaymentService,
    // private appRefresher: AppRefresherService
  ) {
    addIcons({ personCircleOutline, logOutOutline });
    this.userSession$ = this.authService.userSession$;
    // this.appRefresher.refreshAll = this.refreshAll.bind(this);
  }

  /*
  private async refreshAll(): Promise<void> {
    this.loading = true;
    // Only refresh members if last refresh was more than 12 hours ago
    const lastMemberRefresh = this.clubContext.getLastMemberRefresh();
    const now = new Date();
    const twelveHours = 12 * 60 * 60 * 1000;
    console.log('[AppComponent] Last member refresh:', lastMemberRefresh);
    if (!lastMemberRefresh || (now.getTime() - new Date(lastMemberRefresh).getTime()) > twelveHours) {
      console.log('[AppComponent] Refreshing members (last refresh > 12h or never)');
      await new Promise<void>((resolve) => {
        this.memberService.refreshMembers().subscribe({
          next: () => {
            console.log('[AppComponent] Members refreshed, now refreshing attendance and payments in parallel');
            Promise.all([
              this.attendanceService.refreshData().catch(err => console.error('Error refreshing attendance:', err)),
              this.paymentService.refreshData().catch(err => console.error('Error refreshing payments:', err))
            ]).finally(() => {
              this.loading = false;
              resolve();
            });
          },
          error: err => {
            console.error('Error refreshing members:', err);
            this.loading = false;
            resolve();
          }
        });
      });
    } else {
      this.loading = false;
    }
  }
    */

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

    await this.authService.loadSession().catch(err => {
      console.error('Error loading session on app init:', err);
    });

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
          } else {
            // Have active session and club ID
            // Refresh all data on app launch
            console.log('Active session found, refreshing all data');
            // this.refreshAll();
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
