import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Conge } from '../../services/conge';

@Component({
  selector: 'app-demande-conge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-conge.html',
  styleUrls: ['./demande-conge.css']
})
export class DemandeConge {
  private readonly congeService = inject(Conge);

  showConfirm = false;
  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  typesConge = [
    'Congé annuel',
    'Congé exceptionnel',
    'Congé sans solde',
    'Congé maladie'
  ];

  form = {
    nomComplet: '',
    matricule: '',
    gradeFonction: '',
    typeConge: 'Congé annuel',
    dateDebut: '',
    dateFin: '',
    dureeJours: 1,
    soldeDisponible: '18 jours',
    motif: '',
    adressePendantConge: '',
    telephone: ''
  };

  onDatesChanged(): void {
    if (!this.form.dateDebut || !this.form.dateFin) {
      return;
    }
    const d0 = new Date(this.form.dateDebut);
    const d1 = new Date(this.form.dateFin);
    const diffDays =
      Math.round((d1.getTime() - d0.getTime()) / 86400000) + 1;
    if (diffDays > 0) {
      this.form.dureeJours = diffDays;
    }
  }

  /** Enregistrer : envoi direct vers l’API (sans modale). */
  enregistrer(): void {
    this.submitToApi();
  }

  /** Après confirmation dans la modale. */
  envoyerDemande(): void {
    this.submitToApi();
  }

  private submitToApi(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.form.nomComplet.trim() || !this.form.matricule.trim()) {
      this.errorMessage = 'Le nom et le matricule sont obligatoires.';
      this.showConfirm = false;
      return;
    }
    if (!this.form.dateDebut || !this.form.dateFin) {
      this.errorMessage = 'Les dates de début et de fin sont obligatoires.';
      this.showConfirm = false;
      return;
    }
    if (this.form.dureeJours < 1) {
      this.errorMessage =
        'La durée doit être d’au moins 1 jour (choisissez les dates ou saisissez la durée).';
      this.showConfirm = false;
      return;
    }

    this.submitting = true;
    this.congeService
      .creerDemande({
        nomComplet: this.form.nomComplet.trim(),
        matricule: this.form.matricule.trim(),
        gradeFonction: this.form.gradeFonction.trim() || null,
        typeConge: this.form.typeConge,
        dateDebut: this.form.dateDebut,
        dateFin: this.form.dateFin,
        dureeJours: this.form.dureeJours,
        motif: this.form.motif.trim() || null,
        adressePendantConge: this.form.adressePendantConge.trim() || null,
        telephone: this.form.telephone.trim() || null
      })
      .subscribe({
        next: (res) => {
          this.successMessage = `Demande enregistrée en base (n° ${res.id}) — ${res.statut}.`;
          this.showConfirm = false;
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
              : 'Échec : vérifiez que l’API tourne sur http://localhost:5130 (onglet Réseau du navigateur pour le détail).';
          this.showConfirm = false;
          this.submitting = false;
        }
      });
  }
}
