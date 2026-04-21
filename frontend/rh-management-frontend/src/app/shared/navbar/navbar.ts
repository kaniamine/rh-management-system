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
    { label: 'Accueil',               route: '/home-employee',              roles: ['employe'],       icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { label: 'Accueil RH',            route: '/home-rh',                    roles: ['rh', 'admin'],   icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' },
    { label: 'Demande de congé',       route: '/conge',                      roles: ['employe', 'n1'], icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
    { label: 'Autorisation de sortie', route: '/conge/demande-autorisation', roles: ['employe', 'n1'], icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
    { label: 'Congé maladie',          route: '/conge/demande-maladie',      roles: ['employe', 'n1'], icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
    { label: 'Mes demandes',           route: '/dashboard-employee',         roles: ['employe', 'n1'], icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' },
    { label: 'Espace Responsable',     route: '/responsable',                roles: ['n1', 'admin'],   icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
    { label: 'Direction Générale',     route: '/dg',                         roles: ['dg', 'admin'],   icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>' },
    { label: 'Tableau de bord RH',     route: '/dashboard-rh',               roles: ['rh', 'admin'],   icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
    { label: 'Personnel',              route: '/personnel',                   roles: ['rh', 'admin'],   icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' }
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
