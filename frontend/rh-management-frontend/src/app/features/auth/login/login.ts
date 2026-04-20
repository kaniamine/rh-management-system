import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth.service';
import { ChangePasswordModal } from '../../../shared/components/change-password-modal/change-password-modal';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, ChangePasswordModal],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private readonly auth       = inject(AuthService);
  private readonly router     = inject(Router);
  private readonly isBrowser  = isPlatformBrowser(inject(PLATFORM_ID));

  matricule    = '';
  password     = '';
  errorMessage = '';
  loading      = false;

  showPasswordModal = false;

  ngOnInit(): void {
    if (!this.isBrowser) return;
    if (this.auth.isLoggedIn) {
      if (this.auth.session?.premiereConnexion) {
        this.matricule = this.auth.session.matricule;
        this.showPasswordModal = true;
      } else {
        this.router.navigate([this.auth.getHomeRoute()]);
      }
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
        if (this.auth.session?.premiereConnexion) {
          this.showPasswordModal = true;
        } else {
          this.router.navigate([this.auth.getHomeRoute()]);
        }
      },
      error: () => {
        this.loading      = false;
        this.errorMessage = 'Matricule ou mot de passe incorrect.';
      }
    });
  }

  onPasswordChanged(): void {
    this.showPasswordModal = false;
    this.router.navigate([this.auth.getHomeRoute()]);
  }
}
