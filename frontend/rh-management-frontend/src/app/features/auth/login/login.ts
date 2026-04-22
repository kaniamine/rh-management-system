import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private router = inject(Router);
  private http   = inject(HttpClient);

  // Champs du formulaire
  email      = '';
  motDePasse = '';
  showPassword = false;
  errorMessage = '';
  loading      = false;

  // Modale première connexion
  showChangePasswordModal = false;
  newPassword      = '';
  confirmPassword  = '';
  showNewPassword  = false;
  showConfirmPassword = false;
  changeError   = '';
  changeLoading = false;

  private currentUser: any = null;

  onLogin(): void {
    if (!this.email || !this.motDePasse) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }
    this.loading      = true;
    this.errorMessage = '';

    this.http.post<any>('/api/auth/login', {
      matricule: this.email,
      password:  this.motDePasse
    }).subscribe({
      next: (user) => {
        console.log('[LOGIN] Success:', user);
        this.loading     = false;
        this.currentUser = user;
        // Clé lue par AuthService, authGuard et la navbar
        sessionStorage.setItem('user_session', JSON.stringify(user));

        if (user.premiereConnexion === true && user.role !== 'rh') {
          this.showChangePasswordModal = true;
        } else {
          this.navigateToDashboard(user.role);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('[LOGIN] Error:', err);
        this.loading      = false;
        this.errorMessage = err.error?.message || 'Matricule ou mot de passe incorrect.';
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
      matricule:        this.currentUser.matricule,
      ancienMotDePasse: '0000',
      nouveauMotDePasse: this.newPassword
    }).subscribe({
      next: () => {
        this.changeLoading = false;
        const updated = { ...this.currentUser, premiereConnexion: false };
        sessionStorage.setItem('user_session', JSON.stringify(updated));
        this.showChangePasswordModal = false;
        this.navigateToDashboard(this.currentUser.role);
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
