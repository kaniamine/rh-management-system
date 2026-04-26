import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private router      = inject(Router);
  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  email      = '';
  motDePasse = '';
  showPassword = false;
  errorMessage = '';
  loading      = false;

  showChangePasswordModal = false;
  newPassword      = '';
  confirmPassword  = '';
  showNewPassword  = false;
  showConfirmPassword = false;
  changeError   = '';
  changeLoading = false;

  private currentUser: any = null;

  ngOnInit(): void {
    if (this.authService.isLoggedIn) {
      const role = this.authService.role;
      if (this.authService.session?.premiereConnexion && role !== 'rh' && role !== 'admin') {
        this.showChangePasswordModal = true;
      } else {
        this.router.navigate([this.authService.getHomeRoute()]);
      }
    }
  }

  onLogin(): void {
    if (!this.email || !this.motDePasse) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }
    this.loading      = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.motDePasse).subscribe({
      next: () => {
        this.loading     = false;
        const session    = this.authService.session;
        this.currentUser = session;

        if (session?.premiereConnexion && session.role !== 'rh' && session.role !== 'admin') {
          this.showChangePasswordModal = true;
        } else {
          this.navigateToDashboard(session?.role ?? '');
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 0) {
          this.errorMessage = 'Serveur inaccessible. Vérifiez que le backend est démarré (port 5130).';
        } else if (err.status === 401 || err.status === 400) {
          this.errorMessage = err.error?.message ?? 'Matricule ou mot de passe incorrect.';
        } else if (err.status === 404) {
          this.errorMessage = 'Endpoint d\'authentification introuvable (404).';
        } else {
          this.errorMessage = 'Matricule ou mot de passe incorrect.';
        }
      }
    });
  }

  onSaveNewPassword(): void {
    this.changeError = '';

    if (!this.newPassword || !this.confirmPassword) {
      this.changeError = 'Veuillez remplir tous les champs.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.changeError = 'Les mots de passe ne correspondent pas.';
      return;
    }
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$/;
    if (!regex.test(this.newPassword)) {
      this.changeError = 'Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.';
      return;
    }

    this.changeLoading = true;

    this.http.post<any>('/api/auth/changer-mot-de-passe', {
      matricule:         this.currentUser?.matricule,
      ancienMotDePasse:  '0000',
      nouveauMotDePasse: this.newPassword
    }).subscribe({
      next: () => {
        this.changeLoading = false;
        this.authService.markPasswordChanged();
        this.showChangePasswordModal = false;
        this.navigateToDashboard(this.authService.session?.role ?? '');
      },
      error: (err: HttpErrorResponse) => {
        this.changeLoading = false;
        this.changeError   = err.error?.message || 'Erreur lors du changement de mot de passe.';
      }
    });
  }

  private navigateToDashboard(role: string): void {
    const map: Record<string, string> = {
      employe:                '/home-employee',
      rh:                     '/home-rh',
      admin:                  '/home-rh',
      superieur_hierarchique: '/responsable',
      n1:                     '/responsable',
      direction_generale:     '/dg',
      dg:                     '/dg'
    };
    this.router.navigate([map[role] ?? '/home-employee']);
  }
}
