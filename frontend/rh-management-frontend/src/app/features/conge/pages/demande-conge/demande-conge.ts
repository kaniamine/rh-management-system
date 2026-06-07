import { Component, HostListener, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Conge } from '../../services/conge';
import { AuthService } from '../../../../core/auth.service';
import { ParametrageService } from '../../../../core/parametrage.service';

@Component({
  selector: 'app-demande-conge',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './demande-conge.html',
  styleUrls: ['./demande-conge.css']
})
export class DemandeConge implements OnInit, OnDestroy {
  private readonly congeService = inject(Conge);
  private readonly auth         = inject(AuthService);
  private readonly parametrage  = inject(ParametrageService);
  private readonly cdr          = inject(ChangeDetectorRef);

  getInitiales(nom: string): string {
    const parts = (nom ?? '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  showConfirmModal = false;
  currentAction: 'submit' | 'draft' | null = null;
  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  modalTitle = '';
  modalMessage = '';

  delaiMinimumJours = 3;
  workflowActif: string[] = [];
  statutInitial: string = '';

  private readonly _onParametrageUpdated = () => this.chargerParametrage();
  private readonly _onWorkflowUpdated    = () => { this.chargerWorkflow(); this.cdr.detectChanges(); };

  readonly typesConge = [
    'Congé annuel',
    'Congé exceptionnel de courte durée',
    'Congé maternité',
    'Congé de décès',
    'Congé compensatoire'
  ];

  get employee() {
    const s = this.auth.session;
    return {
      nomComplet:            s?.nomComplet                     ?? '',
      matricule:             s?.matricule                      ?? '',
      direction:             s?.direction                      ?? '',
      service:               s?.service                        ?? '',
      fonction:              s?.fonction                       ?? '',
      superieurHierarchique: s?.superieurHierarchiqueMatricule ?? ''
    };
  }

  get soldeCongesJours(): number {
    return this.auth.session?.soldeConges ?? 0;
  }
  readonly demandesEnAttente = 2;

  form = {
    typeConge: 'Congé annuel',
    dateDebut: '',
    dateFin: '',
    motif: '',
    adressePendantConge: '',
    telephone: '',
    pieceJustificativeFichierNom: '' as string
  };

  // ── Lifecycle ────────────────────────────────────────────
  ngOnInit(): void {
    this.chargerParametrage();
    this.chargerWorkflow();
    if (typeof window !== 'undefined') {
      window.addEventListener('parametrage-updated', this._onParametrageUpdated);
      window.addEventListener('workflow-updated', this._onWorkflowUpdated);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('parametrage-updated', this._onParametrageUpdated);
      window.removeEventListener('workflow-updated', this._onWorkflowUpdated);
    }
  }

  chargerParametrage(): void {
    this.delaiMinimumJours = this.parametrage.getDelaiMinimumConge();
    this.chargerWorkflow();
  }

  chargerWorkflow(): void {
    this.workflowActif = this.parametrage.getEtapesActives();
    this.statutInitial = this.parametrage.getStatutInitialConge();
  }

  // ── Calculs automatiques ─────────────────────────────────
  get dureeJours(): number {
    if (!this.form.dateDebut || !this.form.dateFin) return 0;
    const debut = new Date(this.form.dateDebut);
    const fin = new Date(this.form.dateFin);
    if (fin < debut) return 0;
    let jours = 0;
    const cur = new Date(debut);
    while (cur <= fin) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) jours++;
      cur.setDate(cur.getDate() + 1);
    }
    return jours;
  }

  get dureeLabel(): string {
    const j = this.dureeJours;
    if (j <= 0) return '--';
    return `${j} jour${j > 1 ? 's' : ''}`;
  }

  // ── Règles de gestion ────────────────────────────────────
  get isCongeMaladie(): boolean {
    return this.form.typeConge.toLowerCase().includes('maladie');
  }

  get isMotifObligatoire(): boolean {
    return this.form.typeConge === 'Congé exceptionnel de courte durée';
  }

  private readonly typesSansVerifSolde = new Set([
    'Congé maternité',
    'Congé de décès',
    'Congé compensatoire'
  ]);

  get soldeInsuffisant(): boolean {
    if (this.typesSansVerifSolde.has(this.form.typeConge)) return false;
    return this.dureeJours > 0 && this.dureeJours > this.soldeCongesJours;
  }

  get dateTropProche(): boolean {
    if (!this.form.dateDebut) return false;
    const debut = new Date(this.form.dateDebut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let joursOuvres = 0;
    const cur = new Date(today);
    cur.setDate(cur.getDate() + 1);
    while (joursOuvres < this.delaiMinimumJours) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) joursOuvres++;
      if (joursOuvres < this.delaiMinimumJours) cur.setDate(cur.getDate() + 1);
    }
    return debut < cur;
  }

  get dateFinAvantDebut(): boolean {
    if (!this.form.dateDebut || !this.form.dateFin) return false;
    return new Date(this.form.dateFin) < new Date(this.form.dateDebut);
  }

  get peutSoumettre(): boolean {
    return !this.soldeInsuffisant && !this.dateTropProche && !this.dateFinAvantDebut;
  }

  // ── Actions ──────────────────────────────────────────────
  openConfirmModal(action: 'submit' | 'draft'): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.currentAction = action;

    if (action === 'submit') {
      if (!this.form.dateDebut || !this.form.dateFin) {
        this.errorMessage = 'La date de début et la date de fin sont obligatoires.';
        return;
      }
      if (this.dateFinAvantDebut) {
        this.errorMessage = 'La date de fin ne peut pas être antérieure à la date de début.';
        return;
      }
      if (this.dateTropProche) {
        this.errorMessage = `La demande doit être déposée au minimum ${this.delaiMinimumJours} jours ouvrés avant la date de début.`;
        return;
      }
      if (this.soldeInsuffisant) {
        this.errorMessage = `Solde insuffisant : vous demandez ${this.dureeJours} jours mais votre solde est de ${this.soldeCongesJours} jours.`;
        return;
      }
      if (this.isMotifObligatoire && !this.form.motif.trim()) {
        this.errorMessage = `Le motif est obligatoire pour un "${this.form.typeConge}".`;
        return;
      }
      this.modalTitle = 'Confirmer la demande';
      this.modalMessage =
        `Vous allez soumettre une demande de "${this.form.typeConge}" ` +
        `du ${this.form.dateDebut} au ${this.form.dateFin} (${this.dureeLabel}). ` +
        `Votre supérieur hiérarchique sera notifié.`;
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

  onConfirmBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('confirm-backdrop')) {
      this.closeConfirmModal();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeCloseModal(): void {
    if (this.showConfirmModal) this.closeConfirmModal();
  }

  onAnnuler(): void {
    if (this.showConfirmModal) this.closeConfirmModal();
  }

  onJustificatifChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.form.pieceJustificativeFichierNom = file ? file.name : '';
  }

  confirmAction(): void {
    if (!this.currentAction) return;
    const estBrouillon = this.currentAction === 'draft';

    this.submitting = true;
    this.congeService
      .creerDemande({
        typeConge: this.form.typeConge,
        typeDuree: `${this.dureeJours} jour(s)`,
        dateDebut: this.form.dateDebut,
        dateFin: this.form.dateFin,
        estBrouillon,
        statut: estBrouillon ? 'Brouillon' : this.parametrage.getStatutInitialConge(),
        nomComplet: this.auth.session?.nomComplet ?? '',
        matricule: this.auth.session?.matricule ?? '',
        service: this.auth.session?.service ?? '',
        superieurHierarchique: this.auth.session?.superieurHierarchiqueMatricule ?? '',
        motif: this.form.motif.trim() || null,
        adressePendantConge: this.form.adressePendantConge.trim() || null,
        telephone: this.form.telephone.trim() || null,
        pieceJustificativeFichierNom: this.form.pieceJustificativeFichierNom.trim() || null
      })
      .subscribe({
        next: (res) => {
          this.successMessage = estBrouillon
            ? `Brouillon enregistré (réf. #${res.id}).`
            : `Demande soumise avec succès (réf. #${res.id}) — statut : ${res.statut}. Votre supérieur hiérarchique a été notifié.`;
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
              : "Échec d'enregistrement. Veuillez réessayer.";
          this.closeConfirmModal();
          this.submitting = false;
        }
      });
  }
}
