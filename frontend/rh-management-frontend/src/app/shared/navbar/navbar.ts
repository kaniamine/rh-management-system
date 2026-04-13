import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/notification.service';

interface NavItem {
  label: string;
  route: string;
  roles: string[];
  icon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar implements OnInit {
  private readonly router = inject(Router);
  private readonly auth   = inject(AuthService);
  readonly notifSvc       = inject(NotificationService);

  mobileOpen     = false;
  currentRoute   = '';
  showNotifPanel = false;

  get currentRole(): string { return this.auth.role ?? 'employe'; }

  get currentUser() {
    return {
      nom:       this.auth.session?.nomComplet ?? '',
      matricule: this.auth.session?.matricule  ?? '',
      initiales: this.auth.session?.initiales  ?? ''
    };
  }

  get roleLabel(): string {
    const map: Record<string, string> = {
      employe: 'Employé',
      n1:      'Responsable N+1',
      dg:      'Direction Générale',
      rh:      'Direction RH',
      admin:   'Administrateur'
    };
    return map[this.currentRole] ?? '';
  }

  get homeRoute(): string { return this.auth.getHomeRoute(); }

  readonly allNavItems: NavItem[] = [
    { label: 'Accueil',                route: '/home-employee',               roles: ['employe'],        icon: '🏠' },
    { label: 'Accueil RH',             route: '/home-rh',                     roles: ['rh', 'admin'],    icon: '🏢' },
    { label: 'Demande de congé',        route: '/conge',                       roles: ['employe', 'n1'],  icon: '🏖' },
    { label: 'Autorisation de sortie',  route: '/conge/demande-autorisation',  roles: ['employe', 'n1'],  icon: '🕐' },
    { label: 'Congé maladie',           route: '/conge/demande-maladie',       roles: ['employe', 'n1'],  icon: '🏥' },
    { label: 'Mes demandes',            route: '/dashboard-employee',          roles: ['employe', 'n1'],  icon: '📋' },
    { label: 'Espace Responsable',      route: '/responsable',                 roles: ['n1', 'admin'],    icon: '✅' },
    { label: 'Direction Générale',      route: '/dg',                          roles: ['dg', 'admin'],    icon: '🏛' },
    { label: 'Tableau de bord RH',      route: '/dashboard-rh',                roles: ['rh', 'admin'],    icon: '📊' },
    { label: 'Personnel',               route: '/personnel',                   roles: ['rh', 'admin'],    icon: '👥' }
  ];

  get navItems(): NavItem[] {
    return this.allNavItems.filter(i => i.roles.includes(this.currentRole));
  }

  ngOnInit(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.currentRoute   = e.urlAfterRedirects;
        this.mobileOpen     = false;
        this.showNotifPanel = false;
      });
    this.currentRoute = this.router.url;
    this.notifSvc.load();
    this.notifSvc.startPolling();
  }

  isActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }

  toggleMobile(): void   { this.mobileOpen = !this.mobileOpen; }
  closeMobile(): void    { this.mobileOpen = false; }

  toggleNotifPanel(): void {
    this.showNotifPanel = !this.showNotifPanel;
    if (this.showNotifPanel) this.notifSvc.load();
  }

  markAllRead(): void { this.notifSvc.markAllAsRead(); }
  logout(): void     { this.auth.logout(); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notif-btn') && !target.closest('.notif-panel')) {
      this.showNotifPanel = false;
    }
    if (!target.closest('.navbar-mobile-toggle') && !target.closest('.navbar-mobile-menu')) {
      this.mobileOpen = false;
    }
  }
}
