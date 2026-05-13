import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password-modal.html',
  styleUrls: ['./change-password-modal.css']
})
export class ChangePasswordModal {
  @Output() passwordChanged = new EventEmitter<void>();

  ancienMotDePasse  = '';
  nouveauMotDePasse = '';
  confirmMotDePasse = '';

  showAncien   = false;
  showNouveau  = false;
  showConfirm  = false;

  loading      = false;
  errorMessage = '';
  successMessage = '';

  constructor(private auth: AuthService) {}

  get strength(): { score: number; label: string; color: string } {
    const p = this.nouveauMotDePasse;
    let score = 0;
    if (p.length >= 8)                   score++;
    if (/[A-Z]/.test(p))                 score++;
    if (/[a-z]/.test(p))                 score++;
    if (/[0-9]/.test(p))                 score++;
    if (/[^A-Za-z0-9]/.test(p))          score++;

    if (score <= 1) return { score, label: 'Très faible', color: '#c60c30' };
    if (score === 2) return { score, label: 'Faible',      color: '#e05a00' };
    if (score === 3) return { score, label: 'Moyen',       color: '#f0a500' };
    if (score === 4) return { score, label: 'Fort',        color: '#0D776E' };
    return               { score, label: 'Très fort',     color: '#08564f' };
  }

  get passwordsMatch(): boolean {
    return !!this.nouveauMotDePasse && this.nouveauMotDePasse === this.confirmMotDePasse;
  }

  get canSubmit(): boolean {
    return this.nouveauMotDePasse.length >= 6 && this.passwordsMatch;
  }

  onSubmit(): void {
    this.errorMessage   = '';
    this.successMessage = '';

    if (this.nouveauMotDePasse.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }
    if (!this.passwordsMatch) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.loading = true;
    console.log('[MODAL] ancienMotDePasse field value:', this.ancienMotDePasse);
    console.log('[MODAL] nouveauMotDePasse field value:', this.nouveauMotDePasse);
    this.auth.changePassword(this.ancienMotDePasse, this.nouveauMotDePasse, this.confirmMotDePasse)
      .subscribe({
        next: () => {
          this.loading = false;
          // Update session so premiereConnexion = false — modal never comes back
          this.auth.markPasswordChanged();
          this.passwordChanged.emit();
        },
        error: (err: any) => {
          this.loading      = false;
          this.errorMessage = err?.error?.message
            ?? 'Erreur lors du changement de mot de passe.';
        }
      });
  }
}
