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
  private router     = inject(Router);
  private auth       = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean { return isPlatformBrowser(this.platformId); }

  matricule    = '';
  password     = '';
  showPassword = false;
  errorMessage = '';
  loading      = false;

  showForgotPasswordModal = false;

  openForgotPassword():  void { this.showForgotPasswordModal = true; }
  closeForgotPassword(): void { this.showForgotPasswordModal = false; }

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
        // Always navigate to home — modal will show there if needed
        this.router.navigate([this.auth.getHomeRoute()]);
      },
      error: () => {
        this.loading      = false;
        this.errorMessage = 'Matricule ou mot de passe incorrect.';
      }
    });
  }
}
