import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Navbar } from './shared/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('rh-management-frontend');
  private readonly router = inject(Router);

  showNavbar = true;

  // Routes où la navbar ne s'affiche pas
  private readonly noNavbarRoutes = ['/login', '/'];

  ngOnInit(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.showNavbar = !this.noNavbarRoutes.some(r => e.urlAfterRedirects === r);
      });

    this.showNavbar = !this.noNavbarRoutes.includes(this.router.url);
  }
}
