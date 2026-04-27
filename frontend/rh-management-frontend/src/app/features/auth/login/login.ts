import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  private authService = inject(AuthService);

  email        = '';
  motDePasse   = '';
  showPassword = false;
  errorMessage = '';
  loading      = false;

  ngOnInit(): void {
    if (this.authService.isLoggedIn) {
      this.router.navigate([this.authService.getHomeRoute()]);
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
      }
    });
  }
}
