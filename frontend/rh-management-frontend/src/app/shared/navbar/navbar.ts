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
    { label: 'Demande de congé',        route: '/conge',                       roles: ['employe', 'n1'],  icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3a.75.75 0 0 1 1.5 0v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5ZM12 10.5a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 12 10.5Z" clip-rule="evenodd"/></svg>' },
    { label: 'Autorisation de sortie',  route: '/conge/demande-autorisation',  roles: ['employe', 'n1'],  icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9a.75.75 0 0 1-1.5 0V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>' },
    { label: 'Congé maladie',           route: '/conge/demande-maladie',       roles: ['employe', 'n1'],  icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.75 6.75a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clip-rule="evenodd"/></svg>' },
    { label: 'Mes demandes',            route: '/dashboard-employee',          roles: ['employe', 'n1'],  icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M10.5 3A1.501 1.501 0 0 0 9 4.5h6A1.5 1.5 0 0 0 13.5 3h-3Zm-2.693.178A3 3 0 0 1 10.5 1.5h3a3 3 0 0 1 2.694 1.678c.497.042.992.092 1.486.15 1.497.173 2.57 1.46 2.57 2.929V19.5a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3V6.257c0-1.47 1.073-2.756 2.57-2.929.494-.057.99-.108 1.487-.15ZM9 12.75a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5H9Zm0 3a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5H9Zm0-6a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5H9Z" clip-rule="evenodd"/></svg>' },
    { label: 'Espace Responsable',      route: '/responsable',                 roles: ['n1', 'admin'],    icon: '✅' },
    { label: 'Direction Générale',      route: '/dg',                          roles: ['dg', 'admin'],    icon: '🏛' },
    { label: 'Tableau de bord RH',      route: '/dashboard-rh',                roles: ['rh', 'admin'],    icon: '📊' },
    { label: 'Personnel',               route: '/personnel',                   roles: ['rh', 'admin'],    icon: '👥' },
    { label: 'Mon Profil',              route: '/mon-profil',                  roles: ['employe', 'n1', 'dg', 'rh', 'admin'], icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd"/></svg>' }
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
