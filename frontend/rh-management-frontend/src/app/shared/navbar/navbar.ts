import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  private readonly router    = inject(Router);
  private readonly auth      = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly notifSvc          = inject(NotificationService);

  mobileOpen     = false;
  currentRoute   = '';
  showNotifPanel = false;
  showUserMenu   = false;

  get currentRole(): string { return this.auth.role ?? 'employe'; }

  get currentUser() {
    const nomComplet = this.auth.session?.nomComplet ?? '';
    const stored     = this.auth.session?.initiales  ?? '';
    const initiales  = stored || this.computeInitiales(nomComplet);
    return {
      nom:       nomComplet,
      matricule: this.auth.session?.matricule ?? '',
      initiales
    };
  }

  private computeInitiales(nomComplet: string): string {
    const parts = nomComplet.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  safeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  timeAgo(ts: string): string {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'À l\'instant';
    if (m < 60) return `Il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Il y a ${h} h`;
    return `Il y a ${Math.floor(h / 24)} j`;
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
    { label: 'Personnel',               route: '/personnel',                   roles: ['rh', 'admin'],    icon: '👥' },
    { label: 'Mon Profil',              route: '/profil',                      roles: ['employe', 'n1', 'dg', 'rh', 'admin'], icon: '👤' }
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
    this.showUserMenu   = false;
    if (this.showNotifPanel) this.notifSvc.load();
  }

  toggleUserMenu(): void {
    this.showUserMenu   = !this.showUserMenu;
    this.showNotifPanel = false;
  }

  markAllRead(): void { this.notifSvc.markAllAsRead(); }
  logout(): void     { this.auth.logout(); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notif-btn') && !target.closest('.notif-panel')) {
      this.showNotifPanel = false;
    }
    if (!target.closest('.user-menu-wrapper')) {
      this.showUserMenu = false;
    }
    if (!target.closest('.navbar-mobile-toggle') && !target.closest('.navbar-mobile-menu')) {
      this.mobileOpen = false;
    }
  }
}
