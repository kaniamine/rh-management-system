import { Component, OnInit, OnDestroy, PLATFORM_ID, ChangeDetectorRef, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
export class Login implements OnInit, OnDestroy {
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

  isLocked       = false;
  lockoutSeconds = 300;
  private lockInterval: any = null;

  showForgotPasswordModal = false;

  showForgotForm  = false;
  forgotMatricule = '';
  forgotTelephone = '';
  forgotError     = '';
  forgotSuccess   = '';
  forgotLoading   = false;

  ngOnDestroy(): void {
    if (this.lockInterval) clearInterval(this.lockInterval);
  }

  startLockoutCountdown(): void {
    if (this.lockInterval) clearInterval(this.lockInterval);
    this.lockoutSeconds = 300;
    this.lockInterval = setInterval(() => {
      this.lockoutSeconds--;
      if (this.lockoutSeconds <= 0) {
        clearInterval(this.lockInterval);
        this.lockInterval = null;
        this.isLocked     = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
        return;
      }
      const m = Math.floor(this.lockoutSeconds / 60);
      const s = this.lockoutSeconds % 60;
      this.errorMessage = `Compte bloqué. Réessayez dans ${m}:${String(s).padStart(2, '0')}.`;
      this.cdr.detectChanges();
    }, 1000);
  }

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
    this.http.post('/api/auth/mot-de-passe-oublie', {
      matricule: this.forgotMatricule.trim(),
      telephone: this.forgotTelephone.trim()
    }).subscribe({
      next: () => {
        this.forgotSuccess  = 'Un SMS contenant votre mot de passe temporaire a été envoyé directement sur votre numéro enregistré.';
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
        this.capturerLocalisation();
      },
      error: (err: any) => {
        this.loading = false;
        const msg: string = err.status === 0
          ? 'Serveur inaccessible. Vérifiez que le backend est démarré.'
          : err.status === 404
          ? 'Endpoint d\'authentification introuvable (404).'
          : (err?.error?.message ?? 'Matricule ou mot de passe incorrect.');
        this.errorMessage = msg;
        if (msg.includes('bloqué') || msg.includes('Réessayez')) {
          this.isLocked = true;
          this.startLockoutCountdown();
        }
        this.cdr.detectChanges();
      }
    });
  }

  capturerLocalisation(): void {
    const role = this.auth.session?.role ?? '';

    // Pas de géolocalisation pour RH / admin
    if (role === 'rh' || role === 'admin') {
      this.redirigerApresLogin();
      return;
    }

    if (!navigator.geolocation) {
      this.envoyerPointage(null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.envoyerPointage(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      (erreur) => {
        console.warn('[POINTAGE] Géoloc refusée:', erreur);
        this.envoyerPointage(null, null);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }

  envoyerPointage(latitude: number | null, longitude: number | null): void {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken()}`,
      'Content-Type':  'application/json'
    });

    this.http.post(
      'http://localhost:5131/api/pointage/entree-avec-localisation',
      { latitude, longitude, heureLocale: new Date().toISOString() },
      { headers }
    ).subscribe({
      next:  (res: any) => {
        console.log('[POINTAGE] Entrée avec localisation:', res?.statut);
        this.redirigerApresLogin();
      },
      error: (err) => {
        console.error('[POINTAGE] Erreur localisation:', err);
        this.redirigerApresLogin();
      }
    });
  }

  redirigerApresLogin(): void {
    this.router.navigate([this.auth.getHomeRoute()]);
  }
}
