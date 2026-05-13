import { Component, OnInit, inject } from '@angular/core';
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
export class PasswordResetRh implements OnInit {
  private readonly service = inject(PasswordResetService);

  demandes: any[]         = [];
  loading                 = true;
  activeDemandeId: number | null = null;
  nouveauMotDePasse       = '';
  submitLoading           = false;
  submitSuccess           = '';
  submitError             = '';

  ngOnInit(): void { this.loadDemandes(); }

  loadDemandes(): void {
    this.service.getDemandesEnAttente().subscribe({
      next:  (data) => { this.demandes = data; this.loading = false; },
      error: ()     => { this.loading = false; }
    });
  }

  toggleTraiter(id: number): void {
    this.activeDemandeId  = this.activeDemandeId === id ? null : id;
    this.nouveauMotDePasse = '';
    this.submitSuccess    = '';
    this.submitError      = '';
  }

  genererMotDePasse(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    this.nouveauMotDePasse = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  confirmerReinitialisation(demandeId: number): void {
    this.submitError   = '';
    this.submitSuccess = '';
    if (!this.nouveauMotDePasse) {
      this.submitError = 'Veuillez saisir ou générer un mot de passe.';
      return;
    }
    this.submitLoading = true;
    this.service.reinitialiserMotDePasse(demandeId, this.nouveauMotDePasse).subscribe({
      next: () => {
        this.submitSuccess    = 'SMS envoyé — mot de passe réinitialisé.';
        this.demandes         = this.demandes.filter(d => d.id !== demandeId);
        this.submitLoading    = false;
        this.activeDemandeId  = null;
      },
      error: (err: any) => {
        this.submitError   = err.error?.message ?? 'Erreur.';
        this.submitLoading = false;
      }
    });
  }
}
