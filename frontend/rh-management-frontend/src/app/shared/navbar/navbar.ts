import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/notification.service';
import { ChangePasswordModal } from '../components/change-password-modal/change-password-modal';

interface NavItem {
  label: string;
  route: string;
  roles: string[];
  icon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, ChangePasswordModal],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar implements OnInit {
  private readonly router    = inject(Router);
  private readonly auth      = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly notifSvc          = inject(NotificationService);

  mobileOpen              = false;
  currentRoute            = '';
  showNotifPanel          = false;
  showUserMenu            = false;
  showChangePasswordModal = false;

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
    { label: 'Accueil',                route: '/home-employee',              roles: ['employe'],                            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { label: 'Accueil RH',             route: '/home-rh',                    roles: ['rh', 'admin'],                        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' },
    { label: 'Demande de congé',        route: '/conge',                      roles: ['employe', 'n1'],                      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3a.75.75 0 0 1 1.5 0v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5ZM12 10.5a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 12 10.5Z" clip-rule="evenodd"/></svg>' },
    { label: 'Autorisation de sortie',  route: '/conge/demande-autorisation', roles: ['employe', 'n1'],                      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9a.75.75 0 0 1-1.5 0V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>' },
    { label: 'Congé maladie',           route: '/conge/demande-maladie',      roles: ['employe', 'n1'],                      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.75 6.75a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clip-rule="evenodd"/></svg>' },
    { label: 'Mes demandes',            route: '/dashboard-employee',         roles: ['employe', 'n1'],                      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M10.5 3A1.501 1.501 0 0 0 9 4.5h6A1.5 1.5 0 0 0 13.5 3h-3Zm-2.693.178A3 3 0 0 1 10.5 1.5h3a3 3 0 0 1 2.694 1.678c.497.042.992.092 1.486.15 1.497.173 2.57 1.46 2.57 2.929V19.5a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3V6.257c0-1.47 1.073-2.756 2.57-2.929.494-.057.99-.108 1.487-.15ZM9 12.75a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5H9Zm0 3a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5H9Zm0-6a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5H9Z" clip-rule="evenodd"/></svg>' },
    { label: 'Espace Responsable',      route: '/responsable',                roles: ['n1', 'admin'],                        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
    { label: 'Direction Générale',      route: '/dg',                         roles: ['dg', 'admin'],                        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>' },
    { label: 'Tableau de bord RH',      route: '/dashboard-rh',               roles: ['rh', 'admin'],                        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
    { label: 'Personnel',               route: '/personnel',                  roles: ['rh', 'admin'],                        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { label: 'Réinit. mots de passe',  route: '/reinitialisation-mdp',       roles: ['rh', 'admin'],                        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
    { label: 'Mon Profil',              route: '/mon-profil',                 roles: ['employe', 'n1', 'dg', 'rh', 'admin'], icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd"/></svg>' }
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

  onPasswordChanged(): void {
    this.showChangePasswordModal = false;
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
