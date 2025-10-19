import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate() {
    return this.authService.isReady$.pipe(
      filter(ready => ready),
      take(1),
      switchMap(() => this.authService.isAuthenticated$.pipe(
        take(1),
        map(isAuthenticated => {
          if (!isAuthenticated) {
            this.router.navigate(['/login']);
            console.log('User is not authenticated, redirecting to login page.');
            return false;
          }
          console.log('User is authenticated, access granted.');
          return true;
        })
      ))
    );
  }
}
