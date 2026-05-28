import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector:    'app-acces-admin',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './acces-admin.html',
  styleUrls:   ['./acces-admin.css']
})
export class AccesAdmin implements OnInit {
  private readonly http       = inject(HttpClient);
  private readonly router     = inject(Router);
  private readonly auth       = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  cleAdmin  = '';
  erreur    = '';
  isLoading = false;
  showCle   = false;

  ngOnInit(): void {
    if (!this.auth.isLoggedIn || this.auth.role !== 'rh') {
      this.router.navigate(['/dashboard-rh']);
    }
  }

  validerCle(): void {
    if (!this.cleAdmin.trim()) {
      this.erreur = 'Veuillez saisir la clé d\'accès.';
      return;
    }
    this.isLoading = true;
    this.erreur    = '';

    this.http.post<any>('/api/auth/valider-cle-admin', { cle: this.cleAdmin }).subscribe({
      next: res => {
        this.isLoading = false;
        if (res?.adminValide) {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('isAdmin', 'true');
            if (res.adminToken) localStorage.setItem('adminToken', res.adminToken);
          }
          this.router.navigate(['/dashboard-rh']);
        } else {
          this.erreur = 'Clé d\'accès incorrecte.';
        }
      },
      error: err => {
        this.isLoading = false;
        this.erreur    = err?.error?.error ?? 'Clé d\'accès incorrecte. Accès refusé.';
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/dashboard-rh']);
  }

  toggleShowCle(): void {
    this.showCle = !this.showCle;
  }
}
