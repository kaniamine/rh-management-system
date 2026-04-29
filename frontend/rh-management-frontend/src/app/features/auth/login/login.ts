import { Component, OnInit, PLATFORM_ID, ChangeDetectorRef, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ForgotPasswordModal } from '../../../shared/components/forgot-password-modal/forgot-password-modal';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, ForgotPasswordModal],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private router     = inject(Router);
  private auth       = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr        = inject(ChangeDetectorRef);
  private http       = inject(HttpClient);

  private get isBrowser(): boolean { return isPlatformBrowser(this.platformId); }

  matricule    = '';
  password     = '';
  showPassword = false;
  errorMessage = '';
  loading      = false;

  showForgotPasswordModal = false;

  showForgotForm  = false;
  forgotMatricule = '';
  forgotTelephone = '';
  forgotError     = '';
  forgotSuccess   = '';
  forgotLoading   = false;

  openForgotPassword():  void { this.showForgotPasswordModal = true; }
  closeForgotPassword(): void { this.showForgotPasswordModal = false; }

  onForgotPassword(): void {
    this.forgotError   = '';
    this.forgotSuccess = '';
    if (!this.forgotMatricule.trim() || !this.forgotTelephone.trim()) {
      this.forgotError = 'Veuillez remplir tous les champs.';
      this.cdr.detectChanges();
      return;
    }
    this.forgotLoading = true;
    this.http.post('http://localhost:5130/api/auth/mot-de-passe-oublie', {
      matricule: this.forgotMatricule.trim(),
      telephone: this.forgotTelephone.trim()
    }).subscribe({
      next: () => {
        this.forgotSuccess  = 'Votre demande a été transmise à la RH. '
          + 'Vous recevrez un SMS avec votre nouveau mot de passe temporaire.';
        this.forgotLoading  = false;
        this.forgotMatricule = '';
        this.forgotTelephone = '';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Forgot password error:', err);
        this.forgotError =
          err?.error?.message ??
          err?.error?.Message ??
          err?.error?.title ??
          err?.message ??
          'Erreur lors de l\'envoi. Veuillez réessayer.';
        this.forgotLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    if (this.auth.isLoggedIn) {
      this.router.navigate([this.auth.getHomeRoute()]);
    }
  }

  onLogin(): void {
    if (!this.matricule || !this.password) {
      this.errorMessage = 'Veuillez saisir votre matricule et mot de passe.';
      return;
    }
    this.loading      = true;
    this.errorMessage = '';

    this.auth.login(this.matricule, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.router.navigate([this.auth.getHomeRoute()]);
      },
      error: (err: any) => {
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
        this.cdr.detectChanges();
      }
    });
  }
}
