import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Conge } from '../../services/conge';

@Component({
  selector: 'app-demande-conge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-conge.html',
  styleUrls: ['./demande-conge.css'],
  encapsulation: ViewEncapsulation.None
})
export class DemandeConge {
  private readonly congeService = inject(Conge);

  showConfirmModal = false;
  currentAction: 'submit' | 'draft' | null = null;
  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  modalTitle = '';
  modalMessage = '';

  typesConge = ['Congé annuel', 'Congé maladie', 'Congé exceptionnel'];
  typesDuree = ['Journée entière', 'Demi-journée'];

  form = {
    typeConge: 'Congé annuel',
    typeDuree: 'Journée entière',
    dateDebut: '',
    dateFin: '',
    motif: '',
    adressePendantConge: '',
    telephone: '',
    nomComplet: 'Amine Kani',
    matricule: 'EMP-2026-014',
    service: 'Production',
    superieurHierarchique: 'Ahmed Ben Ali',
    pieceJustificativeFichierNom: '' as string
  };

  get soldeCongesJours(): number {
    return 12;
  }

  get demandesEnAttente(): number {
    return 2;
  }

  openConfirmModal(action: 'submit' | 'draft'): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.currentAction = action;

    if (action === 'submit') {
      this.modalTitle = 'Confirmer la demande';
      this.modalMessage = 'Êtes-vous sûr de vouloir soumettre cette demande de congé ?';
    } else {
      this.modalTitle = 'Enregistrer en brouillon';
      this.modalMessage = 'Voulez-vous enregistrer cette demande comme brouillon ?';
    }

    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.currentAction = null;
  }

  onJustificatifChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.form.pieceJustificativeFichierNom = file ? file.name : '';
  }

  confirmAction(): void {
    if (!this.currentAction) {
      return;
    }

    const estBrouillon = this.currentAction === 'draft';

    if (!this.form.dateDebut || !this.form.dateFin) {
      this.errorMessage = 'Indiquez la date de début et la date de fin.';
      this.closeConfirmModal();
      return;
    }

    if (
      this.form.typeDuree.includes('Demi') &&
      this.form.dateDebut !== this.form.dateFin
    ) {
      this.errorMessage =
        'Pour une demi-journée, la date de début et de fin doivent être le même jour.';
      this.closeConfirmModal();
      return;
    }

    if (!estBrouillon) {
      if (!this.form.nomComplet.trim() || !this.form.matricule.trim()) {
        this.errorMessage = 'Le nom et le matricule sont obligatoires.';
        this.closeConfirmModal();
        return;
      }
      if (!this.form.motif.trim()) {
        this.errorMessage = 'Le motif est obligatoire pour soumettre la demande.';
        this.closeConfirmModal();
        return;
      }
    }

    this.submitting = true;
    this.congeService
      .creerDemande({
        typeConge: this.form.typeConge,
        typeDuree: this.form.typeDuree,
        dateDebut: this.form.dateDebut,
        dateFin: this.form.dateFin,
        estBrouillon,
        nomComplet: this.form.nomComplet.trim(),
        matricule: this.form.matricule.trim(),
        service: this.form.service.trim() || null,
        superieurHierarchique: this.form.superieurHierarchique.trim() || null,
        motif: this.form.motif.trim() || null,
        adressePendantConge: this.form.adressePendantConge.trim() || null,
        telephone: this.form.telephone.trim() || null,
        pieceJustificativeFichierNom:
          this.form.pieceJustificativeFichierNom.trim() || null
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
              : 'Échec d’enregistrement (API sur http://localhost:5130 ?).';
          this.closeConfirmModal();
          this.submitting = false;
        }
      });
  }
}
