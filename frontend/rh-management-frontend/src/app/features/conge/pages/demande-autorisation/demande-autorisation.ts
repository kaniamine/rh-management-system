import { Component, HostListener, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Autorisation } from '../../services/autorisation';

@Component({
  selector: 'app-demande-autorisation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './demande-autorisation.html',
  styleUrls: ['./demande-autorisation.css'],
  encapsulation: ViewEncapsulation.None,
})
export class DemandeAutorisation {
  private readonly autorisationService = inject(Autorisation);

  showConfirmModal = false;
  currentAction: 'submit' | 'draft' | null = null;
  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  modalTitle = '';
  modalMessage = '';

  typesAutorisation = ['Autorisation personnelle', 'Autorisation professionnelle', 'Autorisation formation'];

  form = {
    nomComplet: 'Amine Kani',
    matricule: 'EMP-2026-014',
    gradeFonction: 'Direction Finance / Comptabilité',
    typeAutorisation: 'Autorisation personnelle',
    dateDemande: '',
    heureSortie: '',
    heureRetour: '',
    motif: '',
    destination: '',
    telephone: '',
    pieceJointeNom: '' as string,
  };

  get selectedTypeLabel(): string {
    return this.form.typeAutorisation;
  }

  get dureeLabel(): string {
    if (!this.form.heureSortie || !this.form.heureRetour) {
      return '—';
    }
    const start = this.parseTimeToMinutes(this.form.heureSortie);
    const end = this.parseTimeToMinutes(this.form.heureRetour);
    if (start === null || end === null || end <= start) {
      return '—';
    }
    const mins = end - start;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}`;
  }

  onPieceJointeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.form.pieceJointeNom = file ? file.name : '';
  }

  private parseTimeToMinutes(t: string): number | null {
    const parts = t.split(':').map((x) => Number(x));
    if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) {
      return null;
    }
    return parts[0] * 60 + parts[1];
  }

  openConfirmModal(action: 'submit' | 'draft'): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.currentAction = action;

    if (action === 'submit') {
      this.modalTitle = 'Confirmer la demande';
      this.modalMessage = 'Envoyer cette demande d’autorisation pour validation ?';
    } else {
      this.modalTitle = 'Enregistrer en brouillon';
      this.modalMessage = 'Enregistrer cette demande comme brouillon ?';
    }

    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.currentAction = null;
  }

  onConfirmBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('confirm-backdrop')) {
      this.closeConfirmModal();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeCloseModal(): void {
    if (this.showConfirmModal) {
      this.closeConfirmModal();
    }
  }

  onAnnuler(): void {
    if (this.showConfirmModal) {
      this.closeConfirmModal();
    }
  }

  confirmAction(): void {
    if (!this.currentAction) {
      return;
    }

    const estBrouillon = this.currentAction === 'draft';

    if (!this.form.dateDemande.trim()) {
      this.errorMessage = 'Indiquez la date de la demande.';
      this.closeConfirmModal();
      return;
    }

    if (!this.form.nomComplet.trim() || !this.form.matricule.trim()) {
      this.errorMessage = 'Le nom complet et le matricule sont obligatoires.';
      this.closeConfirmModal();
      return;
    }

    if (!this.form.typeAutorisation.trim()) {
      this.errorMessage = 'Choisissez un type d’autorisation.';
      this.closeConfirmModal();
      return;
    }

    if (!estBrouillon) {
      if (!this.form.motif.trim()) {
        this.errorMessage = 'Le motif est obligatoire pour soumettre la demande.';
        this.closeConfirmModal();
        return;
      }
      if (!this.form.heureSortie || !this.form.heureRetour) {
        this.errorMessage = 'Indiquez l’heure de début et l’heure de fin.';
        this.closeConfirmModal();
        return;
      }
      const start = this.parseTimeToMinutes(this.form.heureSortie);
      const end = this.parseTimeToMinutes(this.form.heureRetour);
      if (start === null || end === null || end <= start) {
        this.errorMessage = 'L’heure de fin doit être après l’heure de début.';
        this.closeConfirmModal();
        return;
      }
    }

    const heureSortie = this.normalizeTimeForApi(this.form.heureSortie);
    const heureRetour = this.normalizeTimeForApi(this.form.heureRetour);

    this.submitting = true;
    this.autorisationService
      .creerDemande({
        nomComplet: this.form.nomComplet.trim(),
        matricule: this.form.matricule.trim(),
        gradeFonction: this.form.gradeFonction.trim() || null,
        typeAutorisation: this.form.typeAutorisation.trim(),
        dateDemande: this.form.dateDemande.trim(),
        heureSortie,
        heureRetour,
        motif: this.form.motif.trim() || null,
        destination: this.form.destination.trim() || null,
        telephone: this.form.telephone.trim() || null,
        estBrouillon,
      })
      .subscribe({
        next: (res) => {
          this.successMessage = `Enregistré (id ${res.id}) — statut : ${res.statut}.`;
          this.closeConfirmModal();
          this.submitting = false;
        },
        error: (err: HttpErrorResponse) => {
          const body = err.error;
          const msg =
            (body && typeof body === 'object' && 'message' in body
              ? (body as { message?: string }).message
              : null) ??
            (typeof body === 'string' ? body : null) ??
            err.message;
          this.errorMessage =
            typeof msg === 'string'
              ? msg
              : 'Échec d’enregistrement : API et `ng serve` (proxy) démarrés ?';
          this.closeConfirmModal();
          this.submitting = false;
        },
      });
  }

  /** Envoie "HH:mm:ss" pour faciliter la désérialisation TimeOnly côté API. */
  private normalizeTimeForApi(t: string): string | null {
    const s = t.trim();
    if (!s) {
      return null;
    }
    const parts = s.split(':');
    if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    }
    return s;
  }
}
