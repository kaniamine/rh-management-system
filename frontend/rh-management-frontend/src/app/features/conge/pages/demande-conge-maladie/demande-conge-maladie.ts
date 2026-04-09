import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

type TypeMaladie = 'simple' | 'maternite' | 'chirurgie';

@Component({
  selector: 'app-demande-conge-maladie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './demande-conge-maladie.html',
  styleUrls: ['./demande-conge-maladie.css']
})
export class DemandeCongeArrMaladie {
  private readonly http = inject(HttpClient);

  showConfirm = false;
  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  certificatFile: File | null = null;
  certificatNom: string | null = null;

  // Auto-rempli depuis la session
  readonly employee = {
    nomComplet: 'Amine Kani',
    matricule: 'EMP-2026-014',
    direction: 'Direction Finance',
    service: 'Comptabilité',
    superieurHierarchique: 'Ahmed Ben Ali'
  };

  form = {
    typeMaladie: 'simple' as TypeMaladie,
    dateDebut: '',
    dateFin: '',
    commentaire: ''
  };

  readonly typesMaladie: {
    value: TypeMaladie;
    label: string;
    desc: string;
    exempteAssiduity: boolean;
  }[] = [
    {
      value: 'simple',
      label: 'Maladie simple',
      desc: "Arrêt maladie ordinaire. Inclus dans le calcul de l'assiduité.",
      exempteAssiduity: false
    },
    {
      value: 'maternite',
      label: 'Congé maternité',
      desc: "Congé de maternité légal. Exempté du calcul de l'assiduité.",
      exempteAssiduity: true
    },
    {
      value: 'chirurgie',
      label: 'Congé chirurgie',
      desc: "Convalescence post-opératoire. Exempté du calcul de l'assiduité.",
      exempteAssiduity: true
    }
  ];

  get selectedTypeInfo() {
    return this.typesMaladie.find(t => t.value === this.form.typeMaladie)!;
  }

  get nombreJours(): number {
    if (!this.form.dateDebut || !this.form.dateFin) return 0;
    const debut = new Date(this.form.dateDebut);
    const fin = new Date(this.form.dateFin);
    if (fin < debut) return 0;
    const diff = fin.getTime() - debut.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  get nombreJoursLabel(): string {
    const j = this.nombreJours;
    if (j <= 0) return '--';
    return `${j} jour${j > 1 ? 's' : ''}`;
  }

  get trancheAssiduity(): string {
    const j = this.nombreJours;
    if (this.selectedTypeInfo?.exempteAssiduity) return 'Exempté';
    if (j <= 0) return '--';
    if (j <= 10) return '0 point';
    if (j <= 15) return '0,5 point';
    if (j <= 20) return '1 point';
    if (j <= 30) return '2 points';
    return '3 points';
  }

  onCertificatChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.certificatFile = file;
      this.certificatNom = file.name;
    }
  }

  removeCertificat(): void {
    this.certificatFile = null;
    this.certificatNom = null;
  }

  openConfirm(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.form.dateDebut || !this.form.dateFin) {
      this.errorMessage = 'La date de début et la date de fin sont obligatoires.';
      return;
    }
    const debut = new Date(this.form.dateDebut);
    const fin = new Date(this.form.dateFin);
    if (fin < debut) {
      this.errorMessage = 'La date de fin ne peut pas être antérieure à la date de début.';
      return;
    }
    if (!this.certificatFile) {
      this.errorMessage = 'Le certificat médical est obligatoire. Veuillez joindre le document.';
      return;
    }

    this.showConfirm = true;
  }

  closeConfirm(): void {
    this.showConfirm = false;
  }

  submitDemande(): void {
    this.submitting = true;

    const formData = new FormData();
    formData.append('typeMaladie', this.form.typeMaladie);
    formData.append('matricule', this.employee.matricule);
    formData.append('direction', this.employee.direction);
    formData.append('service', this.employee.service);
    formData.append('dateDebut', this.form.dateDebut);
    formData.append('dateFin', this.form.dateFin);
    formData.append('nombreJours', this.nombreJours.toString());
    if (this.form.commentaire.trim()) {
      formData.append('commentaire', this.form.commentaire.trim());
    }
    if (this.certificatFile) {
      formData.append('certificatMedical', this.certificatFile);
    }

    this.http
      .post<{ id: number; statut: string }>('http://localhost:5130/api/conges-maladie', formData)
      .subscribe({
        next: (res) => {
          this.successMessage = `Demande soumise avec succès (réf. #${res.id}) — statut : ${res.statut}. La Direction RH a été notifiée.`;
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

  saveDraft(): void {
    this.successMessage = 'Brouillon enregistré.';
    this.errorMessage = null;
  }

  private resetForm(): void {
    this.form = { typeMaladie: 'simple', dateDebut: '', dateFin: '', commentaire: '' };
    this.certificatFile = null;
    this.certificatNom = null;
  }
}
