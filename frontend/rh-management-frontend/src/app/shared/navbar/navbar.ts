import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  route: string;
  roles: string[];
  icon: string; // SVG string
}

const ICONS = {
  home: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  homeRh: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  medical: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  list: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  building: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>`,
  chart: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  people: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar implements OnInit {
  private readonly router = inject(Router);

  mobileOpen = false;
  currentRoute = '';
  notifCount = 3;

  currentRole: 'employe' | 'n1' | 'dg' | 'rh' | 'admin' = 'employe';

  readonly currentUser = {
    nom: 'Amine Kani',
    role: 'Employé',
    matricule: 'EMP-2026-014',
    initiales: 'AK'
  };

  readonly allNavItems: NavItem[] = [
    { label: 'Accueil',              route: '/home-employee',            roles: ['employe'],          icon: ICONS.home },
    { label: 'Accueil RH',           route: '/home-rh',                  roles: ['rh', 'admin'],      icon: ICONS.homeRh },
    { label: 'Demande de congé',     route: '/conge',                    roles: ['employe', 'n1'],    icon: ICONS.calendar },
    { label: 'Autorisation de sortie', route: '/conge/demande-autorisation', roles: ['employe', 'n1'], icon: ICONS.clock },
    { label: 'Congé maladie',        route: '/conge/demande-maladie',    roles: ['employe', 'n1'],    icon: ICONS.medical },
    { label: 'Mes demandes',         route: '/dashboard-employee',       roles: ['employe', 'n1'],    icon: ICONS.list },
    { label: 'Espace Responsable',   route: '/responsable',              roles: ['n1', 'admin'],      icon: ICONS.check },
    { label: 'Direction Générale',   route: '/dg',                       roles: ['dg', 'admin'],      icon: ICONS.building },
    { label: 'Tableau de bord RH',   route: '/dashboard-rh',             roles: ['rh', 'admin'],      icon: ICONS.chart },
    { label: 'Personnel',            route: '/personnel',                roles: ['rh', 'admin'],      icon: ICONS.people },
  ];

  get navItems(): NavItem[] {
    return this.allNavItems.filter(item => item.roles.includes(this.currentRole));
  }

  get homeRoute(): string {
    const map: Record<string, string> = {
      employe: '/home-employee', n1: '/responsable',
      dg: '/dg', rh: '/home-rh', admin: '/home-rh'
    };
    return map[this.currentRole] ?? '/home-employee';
  }

  get roleLabel(): string {
    const map: Record<string, string> = {
      employe: 'Employé', n1: 'Responsable N+1',
      dg: 'Direction Générale', rh: 'Direction RH', admin: 'Administrateur'
    };
    return map[this.currentRole] ?? '';
  }

  ngOnInit(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.currentRoute = e.urlAfterRedirects;
        this.mobileOpen = false;
      });
    this.currentRoute = this.router.url;
  }

  isActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }

  toggleMobile(): void { this.mobileOpen = !this.mobileOpen; }
  closeMobile(): void { this.mobileOpen = false; }
  logout(): void { this.router.navigate(['/login']); }

  switchRole(role: 'employe' | 'n1' | 'dg' | 'rh' | 'admin'): void {
    this.currentRole = role;
    this.router.navigate([this.homeRoute]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.hamburger') && !target.closest('.mobile-menu')) {
      this.mobileOpen = false;
    }
  }
}
