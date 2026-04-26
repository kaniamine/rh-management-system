import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/auth.service';
import { Autorisation, CumulMensuelResponse } from '../../services/autorisation';

type AutorisationType = 'personnel' | 'professionnel' | 'formation';

interface TypeOption {
  value: AutorisationType;
  label: string;
  labelAr: string;
  desc: string;
}

// Plages horaires autorisées selon la période
interface PlageHoraire {
  debut: number; // minutes depuis minuit
  fin: number;
}

@Component({
  selector: 'app-demande-autorisation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './demande-autorisation.html',
  styleUrls: ['./demande-autorisation.css'],
})
export class DemandeAutorisation implements OnInit {
  private readonly autorisationService = inject(Autorisation);
  private readonly auth = inject(AuthService);

  selectedType: AutorisationType = 'personnel';
  showConfirm = false;
  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  uploadedFiles: { name: string; file: File }[] = [];

  cumulMensuel: CumulMensuelResponse | null = null;
  cumulLoading = false;

  readonly LIMITE_DUREE_PERSONNELLE_MIN = 90;

  get employee() {
    const s = this.auth.session;
    return {
      nomComplet:            s?.nomComplet                     ?? '',
      matricule:             s?.matricule                      ?? '',
      direction:             s?.direction                      ?? '',
      service:               s?.service                        ?? '',
      superieurHierarchique: s?.superieurHierarchiqueMatricule ?? ''
    };
  }

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

  ngOnInit(): void {
    this.chargerCumulMensuel();
  }

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
    const end   = this.parseMinutes(this.form.heureRetour);
    if (start < 0 || end < 0 || end <= start) return 0;

    let total = end - start;
    const lunchStart = 12 * 60;
    const lunchEnd   = 13 * 60;
    const overlapStart = Math.max(start, lunchStart);
    const overlapEnd   = Math.min(end, lunchEnd);
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
    return this.selectedType === 'personnel' && this.dureeMinutes > this.LIMITE_DUREE_PERSONNELLE_MIN;
  }

  // Vérifie si la date saisie tombe en période estivale (juillet–août)
  private isEte(dateStr: string): boolean {
    if (!dateStr) return false;
    const mois = new Date(dateStr).getMonth() + 1;
    return mois === 7 || mois === 8;
  }

  // Retourne les plages autorisées selon la période
  get plagesAutorisees(): PlageHoraire[] {
    if (this.isEte(this.form.date)) {
      return [{ debut: 7 * 60 + 30, fin: 13 * 60 + 30 }];
    }
    return [
      { debut: 8 * 60, fin: 12 * 60 },
      { debut: 13 * 60, fin: 17 * 60 + 20 }
    ];
  }

  get plagesLabel(): string {
    if (this.isEte(this.form.date)) return '07h30–13h30';
    return '08h00–12h00 et 13h00–17h20';
  }

  private estDansPlage(minutes: number): boolean {
    return this.plagesAutorisees.some(p => minutes >= p.debut && minutes <= p.fin);
  }

  get heureDepartHorsPlage(): boolean {
    const m = this.parseMinutes(this.form.heureDepart);
    return m >= 0 && !this.estDansPlage(m);
  }

  get heureRetourHorsPlage(): boolean {
    const m = this.parseMinutes(this.form.heureRetour);
    return m >= 0 && !this.estDansPlage(m);
  }

  get cumulMensuelLabel(): string {
    if (!this.cumulMensuel) return '--';
    const totalMins = this.cumulMensuel.dureeMinutesCumulee;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}`;
  }

  get nombreAutorisationsMois(): number {
    return this.cumulMensuel?.nombreAutorisations ?? 0;
  }

  private chargerCumulMensuel(): void {
    const matricule = this.auth.session?.matricule;
    if (!matricule) return;
    const now = new Date();
    const mois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.cumulLoading = true;
    this.autorisationService.getCumulMensuel(matricule, mois).subscribe({
      next: (data) => {
        this.cumulMensuel = data;
        this.cumulLoading = false;
      },
      error: () => {
        this.cumulLoading = false;
      }
    });
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
    const end   = this.parseMinutes(this.form.heureRetour);
    if (end <= start) {
      this.errorMessage = "L'heure de retour doit être postérieure à l'heure de départ.";
      return;
    }
    if (this.heureDepartHorsPlage || this.heureRetourHorsPlage) {
      this.errorMessage = `Les horaires doivent être compris dans les plages de travail autorisées : ${this.plagesLabel}.`;
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
    this.errorMessage = null;
    this.successMessage = null;

    const payload = this.buildPayload(true);
    this.autorisationService.creerDemande(payload).subscribe({
      next: (res) => {
        this.successMessage = `Brouillon enregistré (réf. #${res.id}).`;
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message ?? err.message;
        this.errorMessage = typeof msg === 'string' ? msg : "Échec de l'enregistrement du brouillon.";
      }
    });
  }

  submitDemande(): void {
    this.submitting = true;

    const payload = this.buildPayload(false);
    this.autorisationService.creerDemande(payload).subscribe({
      next: (res) => {
        this.successMessage = `Demande soumise avec succès (réf. #${res.id}) — statut : ${res.statut}. Votre supérieur hiérarchique a été notifié.`;
        this.showConfirm  = false;
        this.submitting   = false;
        this.resetForm();
        this.chargerCumulMensuel();
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
        this.submitting  = false;
      }
    });
  }

  private buildPayload(estBrouillon: boolean) {
    const s = this.auth.session;
    return {
      nomComplet:            s?.nomComplet                     ?? '',
      matricule:             s?.matricule                      ?? '',
      direction:             s?.direction                      ?? '',
      service:               s?.service                        ?? '',
      superieurHierarchique: s?.superieurHierarchiqueMatricule ?? '',
      typeAutorisation:      this.selectedType,
      dateDemande:           this.form.date,
      heureSortie:           this.form.heureDepart || null,
      heureRetour:           this.form.heureRetour || null,
      dureeCalculee:         this.dureeMinutes > 0 ? this.dureeCalculee : null,
      motif:                 this.form.motif.trim() || null,
      commentaire:           this.form.commentaire.trim() || null,
      estBrouillon
    };
  }

  private resetForm(): void {
    this.form = { date: '', heureDepart: '', heureRetour: '', motif: '', commentaire: '' };
    this.uploadedFiles = [];
  }
}
