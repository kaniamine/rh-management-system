import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
<<<<<<< HEAD
  private router      = inject(Router);
  private authService = inject(AuthService);

  email        = '';
  motDePasse   = '';
=======
  private router     = inject(Router);
  private auth       = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean { return isPlatformBrowser(this.platformId); }

  matricule    = '';
  password     = '';
>>>>>>> dd707c7423a8a8f0531d4584df3b2a511580008b
  showPassword = false;
  errorMessage = '';
  loading      = false;

<<<<<<< HEAD
  ngOnInit(): void {
    if (this.authService.isLoggedIn) {
      this.router.navigate([this.authService.getHomeRoute()]);
=======
  showForgotPasswordModal = false;

  openForgotPassword():  void { this.showForgotPasswordModal = true; }
  closeForgotPassword(): void { this.showForgotPasswordModal = false; }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    if (this.auth.isLoggedIn) {
      this.router.navigate([this.auth.getHomeRoute()]);
>>>>>>> dd707c7423a8a8f0531d4584df3b2a511580008b
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
<<<<<<< HEAD
        this.loading = false;
        this.router.navigate([this.authService.getHomeRoute()]);
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
=======
        this.loading = false;
        // Always navigate to home — modal will show there if needed
        this.router.navigate([this.auth.getHomeRoute()]);
      },
      error: () => {
        this.loading      = false;
        this.errorMessage = 'Matricule ou mot de passe incorrect.';
>>>>>>> dd707c7423a8a8f0531d4584df3b2a511580008b
      }
    });
  }
}
