import { Component } from '@angular/core';
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
export class Login {
  matricule = '';
  password = '';
  errorMessage = '';
  loading = false;
  showPassword = false;

  constructor(private auth: AuthService, private router: Router) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    if (!this.matricule.trim() || !this.password.trim()) {
      this.errorMessage = 'Veuillez saisir le matricule et le mot de passe.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth.login(this.matricule.trim(), this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate([this.auth.getHomeRoute()]);
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
          this.errorMessage = err.error?.message ?? `Erreur ${err.status} — réessayez.`;
        }
      }
    });
  }
}
