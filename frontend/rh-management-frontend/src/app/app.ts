import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Navbar } from './shared/navbar/navbar';
import { AuthService } from './core/auth.service';
import { ChangePasswordModal } from './shared/components/change-password-modal/change-password-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar, ChangePasswordModal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('rh-management-frontend');
  private readonly router  = inject(Router);
  private readonly auth    = inject(AuthService);

  showNavbar = true;

  private readonly noNavbarRoutes = ['/login', '/'];

  get showFirstLoginModal(): boolean {
    return this.auth.isLoggedIn && this.auth.session?.premiereConnexion === true;
  }

  onFirstLoginPasswordChanged(): void {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.showNavbar = !this.noNavbarRoutes.some(r => e.urlAfterRedirects === r);
      });

    this.showNavbar = !this.noNavbarRoutes.includes(this.router.url);
  }
}
