import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  route: string;
  roles: string[];
  icon: string;
}

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

  // Rôle courant — sera géré par un AuthService en production
  // Valeurs possibles: 'employe' | 'n1' | 'dg' | 'rh' | 'admin'
  currentRole: 'employe' | 'n1' | 'dg' | 'rh' | 'admin' = 'employe';

  readonly currentUser = {
    nom: 'Amine Kani',
    role: 'Employé',
    matricule: 'EMP-2026-014',
    initiales: 'AK'
  };

  readonly allNavItems: NavItem[] = [
    {
      label: 'Accueil',
      route: '/home-employee',
      roles: ['employe'],
      icon: '🏠'
    },
    {
      label: 'Accueil RH',
      route: '/home-rh',
      roles: ['rh', 'admin'],
      icon: '🏢'
    },
    {
      label: 'Demande de congé',
      route: '/conge',
      roles: ['employe', 'n1'],
      icon: '🏖'
    },
    {
      label: 'Autorisation de sortie',
      route: '/conge/demande-autorisation',
      roles: ['employe', 'n1'],
      icon: '🕐'
    },
    {
      label: 'Congé maladie',
      route: '/conge/demande-maladie',
      roles: ['employe', 'n1'],
      icon: '🏥'
    },
    {
      label: 'Mes demandes',
      route: '/dashboard-employee',
      roles: ['employe', 'n1'],
      icon: '📋'
    },
    {
      label: 'Espace Responsable',
      route: '/responsable',
      roles: ['n1', 'admin'],
      icon: '✅'
    },
    {
      label: 'Direction Générale',
      route: '/dg',
      roles: ['dg', 'admin'],
      icon: '🏛'
    },
    {
      label: 'Tableau de bord RH',
      route: '/dashboard-rh',
      roles: ['rh', 'admin'],
      icon: '📊'
    },
    {
      label: 'Personnel',
      route: '/personnel',
      roles: ['rh', 'admin'],
      icon: '👥'
    }
  ];

  get navItems(): NavItem[] {
    return this.allNavItems.filter(item => item.roles.includes(this.currentRole));
  }

  get homeRoute(): string {
    const map: Record<string, string> = {
      employe: '/home-employee',
      n1: '/responsable',
      dg: '/dg',
      rh: '/home-rh',
      admin: '/home-rh'
    };
    return map[this.currentRole] ?? '/home-employee';
  }

  get roleLabel(): string {
    const map: Record<string, string> = {
      employe: 'Employé',
      n1: 'Responsable N+1',
      dg: 'Direction Générale',
      rh: 'Direction RH',
      admin: 'Administrateur'
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

  toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile(): void {
    this.mobileOpen = false;
  }

  logout(): void {
    this.router.navigate(['/login']);
  }

  // Demo: cycle through roles to test navigation
  switchRole(role: 'employe' | 'n1' | 'dg' | 'rh' | 'admin'): void {
    this.currentRole = role;
    this.router.navigate([this.homeRoute]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar-mobile-toggle') && !target.closest('.navbar-mobile-menu')) {
      this.mobileOpen = false;
    }
  }
}
