<<<<<<< HEAD
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

type AutorisationType = 'personnel' | 'professionnel' | 'formation';
=======
import { Component, HostListener, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Autorisation } from '../../services/autorisation';
>>>>>>> b1d4b8fa1af0e43a646a7e82cf4937261ea6b753

interface TypeOption {
  value: AutorisationType;
  label: string;
  labelAr: string;
  desc: string;
}

@Component({
  selector: 'app-demande-autorisation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './demande-autorisation.html',
  styleUrls: ['./demande-autorisation.css'],
  encapsulation: ViewEncapsulation.None,
})
export class DemandeAutorisation {
<<<<<<< HEAD
  private readonly http = inject(HttpClient);

  selectedType: AutorisationType = 'personnel';
  showConfirm = false;
  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  uploadedFiles: { name: string; file: File }[] = [];

  // Auto-rempli depuis la session
  readonly employee = {
    nomComplet: 'Amine Kani',
    matricule: 'EMP-2026-014',
    direction: 'Direction Finance',
    service: 'Comptabilité',
    superieurHierarchique: 'Ahmed Ben Ali'
  };

  form = {
    date: '',
    heureDepart: '',
    heureRetour: '',
    motif: '',
    commentaire: ''
  };

  readonly typeOptions: TypeOption[] = [
    {
      value: 'personnel',
      label: 'Personnelle',
      labelAr: 'إذن مغادرة شخصي',
      desc: 'Rendez-vous médical, démarches administratives personnelles, etc.'
    },
    {
      value: 'professionnel',
      label: 'Professionnelle',
      labelAr: 'إذن مغادرة عمل',
      desc: 'Mission externe, réunion institutionnelle, déplacement professionnel.'
    },
    {
      value: 'formation',
      label: 'Formation',
      labelAr: 'إذن مغادرة تكوين',
      desc: 'Séminaire, atelier de formation ou conférence professionnelle externe.'
=======
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
>>>>>>> b1d4b8fa1af0e43a646a7e82cf4937261ea6b753
    }
  ];

  get selectedTypeLabel(): string {
    return this.typeOptions.find(t => t.value === this.selectedType)?.label ?? '';
  }

<<<<<<< HEAD
  get selectedTypeLabelAr(): string {
    return this.typeOptions.find(t => t.value === this.selectedType)?.labelAr ?? '';
  }

  selectType(type: AutorisationType): void {
    this.selectedType = type;
    this.errorMessage = null;
  }

  private parseMinutes(time: string): number {
    if (!time) return -1;
    const parts = time.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  get dureeMinutes(): number {
    const start = this.parseMinutes(this.form.heureDepart);
    const end = this.parseMinutes(this.form.heureRetour);
    if (start < 0 || end < 0 || end <= start) return 0;

    let total = end - start;

    // Exclure la pause déjeuner 12h00-13h00
    const lunchStart = 12 * 60;
    const lunchEnd = 13 * 60;
    const overlapStart = Math.max(start, lunchStart);
    const overlapEnd = Math.min(end, lunchEnd);
    if (overlapEnd > overlapStart) {
      total -= (overlapEnd - overlapStart);
    }

    return total;
  }

  get dureeCalculee(): string {
    const mins = this.dureeMinutes;
    if (mins <= 0) return '--';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}`;
  }

  get isOverLimit(): boolean {
    return this.selectedType === 'personnel' && this.dureeMinutes > 90;
  }

  // Serait récupéré depuis l'API en production
  get cumulMensuel(): string {
    return '03h 20';
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      this.uploadedFiles.push({ name: file.name, file });
    });
    input.value = '';
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  openConfirm(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.form.date) {
      this.errorMessage = 'La date est obligatoire.';
      return;
    }
    if (!this.form.heureDepart || !this.form.heureRetour) {
      this.errorMessage = "L'heure de départ et l'heure de retour sont obligatoires.";
      return;
    }
    const start = this.parseMinutes(this.form.heureDepart);
    const end = this.parseMinutes(this.form.heureRetour);
    if (end <= start) {
      this.errorMessage = "L'heure de retour doit être postérieure à l'heure de départ.";
      return;
    }
    if (!this.form.motif.trim()) {
      this.errorMessage = 'Le motif est obligatoire.';
      return;
    }
    if (this.isOverLimit) {
      this.errorMessage =
        `La durée calculée (${this.dureeCalculee}) dépasse la limite de 1h30 autorisée pour les autorisations personnelles.`;
      return;
    }

    this.showConfirm = true;
  }

  closeConfirm(): void {
    this.showConfirm = false;
  }

  saveDraft(): void {
    this.successMessage = 'Brouillon enregistré.';
    this.errorMessage = null;
  }

  submitDemande(): void {
    this.submitting = true;

    const payload = {
      type: this.selectedType,
      matricule: this.employee.matricule,
      direction: this.employee.direction,
      service: this.employee.service,
      superieurHierarchique: this.employee.superieurHierarchique,
      date: this.form.date,
      heureDepart: this.form.heureDepart,
      heureRetour: this.form.heureRetour,
      duree: this.dureeCalculee,
      motif: this.form.motif.trim(),
      commentaire: this.form.commentaire.trim() || null,
      estBrouillon: false
    };

    this.http
      .post<{ id: number; statut: string }>('http://localhost:5130/api/autorisations-sortie', payload)
      .subscribe({
        next: (res) => {
          this.successMessage = `Demande soumise avec succès (réf. #${res.id}) — statut : ${res.statut}. Votre supérieur hiérarchique a été notifié.`;
          this.showConfirm = false;
          this.submitting = false;
          this.resetForm();
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
              : "Échec de l'envoi (API sur http://localhost:5130 indisponible ?).";
          this.showConfirm = false;
          this.submitting = false;
        }
      });
  }

  private resetForm(): void {
    this.form = { date: '', heureDepart: '', heureRetour: '', motif: '', commentaire: '' };
    this.uploadedFiles = [];
  }
=======
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
>>>>>>> b1d4b8fa1af0e43a646a7e82cf4937261ea6b753
}
