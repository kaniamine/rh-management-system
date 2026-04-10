import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

type AutorisationType = 'personnel' | 'professionnel' | 'formation';

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
})
export class DemandeAutorisation {
  private readonly http = inject(HttpClient);

  selectedType: AutorisationType = 'personnel';
  showConfirm = false;
  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  uploadedFiles: { name: string; file: File }[] = [];

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
    }
  ];

  get selectedTypeLabel(): string {
    return this.typeOptions.find(t => t.value === this.selectedType)?.label ?? '';
  }

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
          this.successMessage = `Demande soumise avec succès (réf. #${res.id}) — statut : ${res.statut}.`;
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
}
