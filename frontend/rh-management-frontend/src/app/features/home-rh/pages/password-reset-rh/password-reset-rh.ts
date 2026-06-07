import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PasswordResetService } from '../../services/password-reset.service';

@Component({
  selector: 'app-password-reset-rh',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password-reset-rh.html',
  styleUrl: './password-reset-rh.css'
})
export class PasswordResetRh {
  private readonly service = inject(PasswordResetService);

  matricule         = '';
  nouveauMotDePasse = '';
  submitLoading     = false;
  submitSuccess     = '';
  submitError       = '';

  genererMotDePasse(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    this.nouveauMotDePasse = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  reinitialiser(): void {
    this.submitError   = '';
    this.submitSuccess = '';

    if (!this.matricule.trim()) {
      this.submitError = 'Veuillez saisir le matricule de l\'employé.';
      return;
    }
    if (!this.nouveauMotDePasse.trim()) {
      this.submitError = 'Veuillez saisir ou générer un mot de passe.';
      return;
    }

    this.submitLoading = true;
    this.service.reinitialiserManuel(this.matricule.trim().toUpperCase(), this.nouveauMotDePasse).subscribe({
      next: () => {
        this.submitSuccess    = 'Mot de passe réinitialisé avec succès. Un SMS a été envoyé à l\'employé.';
        this.submitLoading    = false;
        this.matricule        = '';
        this.nouveauMotDePasse = '';
      },
      error: (err: any) => {
        this.submitError   = err?.error?.message ?? err?.error?.error ?? 'Erreur lors de la réinitialisation.';
        this.submitLoading = false;
      }
    });
  }
}
