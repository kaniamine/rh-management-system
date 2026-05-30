import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth.service';
import { Conge } from '../../../conge/services/conge';
import { Autorisation } from '../../../conge/services/autorisation';
import { Maladie } from '../../../conge/services/maladie';

interface UnifiedDemande {
  id: number;
  type: 'conge' | 'autorisation' | 'maladie';
  typeLabel: string;
  sousType: string;
  nomComplet: string;
  matricule: string;
  service: string;
  dateDebut: string;
  dateFin?: string;
  duree?: string;
  motif: string;
  statut: string;
}

@Component({
  selector: 'app-consulter-demandes-rh',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consulter-demandes-rh.html',
  styleUrls: ['./consulter-demandes-rh.css']
})
export class ConsulterDemandesRh implements OnInit {
  private conge  = inject(Conge);
  private auto   = inject(Autorisation);
  private mal    = inject(Maladie);
  private auth   = inject(AuthService);
  private cdr    = inject(ChangeDetectorRef);

  loading       = false;
  error         = '';
  actionLoading = false;
  actionError   = '';
  successMsg    = '';

  demandes: UnifiedDemande[]             = [];
  filterStatut                            = '';
  selectedDemande: UnifiedDemande | null  = null;
  showRejectModal  = false;
  rejectMotif      = '';

  ngOnInit(): void { this.loadDemandes(); }

  loadDemandes(): void {
    this.loading    = true;
    this.error      = '';
    this.successMsg = '';
    this.cdr.detectChanges();
    forkJoin({
      conges:        this.conge.getDemandes().pipe(catchError(() => of([]))),
      autorisations: this.auto.getDemandes().pipe(catchError(() => of([]))),
      maladies:      this.mal.getDemandes().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ conges, autorisations, maladies }) => {
        const mc = (conges as any[]).map((d): UnifiedDemande => ({
          id:         d.id,
          type:       'conge',
          typeLabel:  'Congé',
          sousType:   d.typeConge ?? '',
          nomComplet: d.nomComplet ?? '',
          matricule:  d.matricule ?? '',
          service:    d.service ?? '',
          dateDebut:  d.dateDebut ?? '',
          dateFin:    d.dateFin,
          duree:      d.dureeJours != null ? `${d.dureeJours} j` : '',
          motif:      d.motif ?? '',
          statut:     d.statut ?? ''
        }));
        const ma = (autorisations as any[]).map((d): UnifiedDemande => ({
          id:         d.id,
          type:       'autorisation',
          typeLabel:  'Autorisation',
          sousType:   d.typeAutorisation ?? '',
          nomComplet: d.nomComplet ?? '',
          matricule:  d.matricule ?? '',
          service:    d.service ?? '',
          dateDebut:  d.dateDemande ?? '',
          motif:      d.motif ?? '',
          statut:     d.statut ?? ''
        }));
        const mm = (maladies as any[]).map((d): UnifiedDemande => ({
          id:         d.id,
          type:       'maladie',
          typeLabel:  'Maladie',
          sousType:   d.typeMaladie ?? '',
          nomComplet: d.nomComplet ?? '',
          matricule:  d.matricule ?? '',
          service:    d.service ?? '',
          dateDebut:  d.dateDebut ?? '',
          dateFin:    d.dateFin,
          duree:      d.nombreJours != null ? `${d.nombreJours} j` : '',
          motif:      d.motif ?? '',
          statut:     d.statut ?? ''
        }));
        this.demandes = [...mc, ...ma, ...mm];
        this.loading  = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error   = 'Erreur de chargement des demandes.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Section 1: actionable — pending RH treatment ─────────────────────────
  get demandesEnAttenteRH(): UnifiedDemande[] {
    return this.demandes.filter(d =>
      d.statut === 'Validée – En traitement RH' ||
      d.statut === 'En attente de validation RH'
    );
  }

  // ── Section 2: historique with optional statut filter ────────────────────
  get demandesHistorique(): UnifiedDemande[] {
    return this.demandes
      .filter(d =>
        d.statut !== 'Validée – En traitement RH' &&
        d.statut !== 'En attente de validation RH'
      )
      .filter(d => {
        if (!this.filterStatut) return true;
        if (this.filterStatut === 'Rejetée')
          return d.statut.startsWith('Rejetée') || d.statut === 'Annulée';
        if (this.filterStatut === 'En attente')
          return d.statut.startsWith('En attente');
        return d.statut === this.filterStatut;
      })
      .sort((a, b) =>
        new Date(b.dateDebut ?? 0).getTime() - new Date(a.dateDebut ?? 0).getTime()
      );
  }

  countByType(type: string): number {
    return this.demandes.filter(d => d.type === type).length;
  }

  // ── Selection & modal ─────────────────────────────────────────────────────
  selectDemande(d: UnifiedDemande): void {
    this.selectedDemande = d;
    this.showRejectModal = false;
    this.rejectMotif     = '';
    this.actionError     = '';
  }

  closeDetail(): void {
    this.selectedDemande  = null;
    this.showRejectModal  = false;
    this.rejectMotif      = '';
    this.actionError      = '';
  }

  openRejectModal(): void {
    this.showRejectModal = true;
    this.rejectMotif     = '';
  }

  // ── Inline action helpers ─────────────────────────────────────────────────
  cloturerDemande(d: UnifiedDemande): void { this.cloturerConge(d); }

  rejeterDemande(d: UnifiedDemande): void {
    this.selectDemande(d);
    this.openRejectModal();
  }

  // ── Core action methods ───────────────────────────────────────────────────
  cloturerConge(d: UnifiedDemande): void {
    const matricule = this.auth.session?.matricule ?? '';
    this.actionLoading = true;
    this.actionError   = '';
    this.conge.cloturer(d.id, matricule, '').subscribe({
      next: () => {
        this.actionLoading   = false;
        this.selectedDemande = null;
        this.successMsg      = 'Demande clôturée avec succès.';
        this.cdr.detectChanges();
        this.loadDemandes();
      },
      error: (err: any) => {
        this.actionLoading = false;
        this.actionError   = err?.error?.message ?? 'Erreur lors de la clôture.';
        this.cdr.detectChanges();
      }
    });
  }

  validerMaladie(d: UnifiedDemande): void {
    const matricule = this.auth.session?.matricule ?? '';
    this.actionLoading = true;
    this.actionError   = '';
    this.mal.valider(d.id, matricule, '').subscribe({
      next: () => {
        this.actionLoading   = false;
        this.selectedDemande = null;
        this.successMsg      = 'Maladie validée avec succès.';
        this.cdr.detectChanges();
        this.loadDemandes();
      },
      error: (err: any) => {
        this.actionLoading = false;
        this.actionError   = err?.error?.message ?? 'Erreur lors de la validation.';
        this.cdr.detectChanges();
      }
    });
  }

  rejeterMaladie(): void {
    if (!this.selectedDemande || !this.rejectMotif.trim()) return;
    const matricule = this.auth.session?.matricule ?? '';
    this.actionLoading = true;
    this.actionError   = '';
    this.mal.rejeter(this.selectedDemande.id, matricule, this.rejectMotif).subscribe({
      next: () => {
        this.actionLoading   = false;
        this.showRejectModal = false;
        this.selectedDemande = null;
        this.rejectMotif     = '';
        this.successMsg      = 'Demande rejetée.';
        this.cdr.detectChanges();
        this.loadDemandes();
      },
      error: (err: any) => {
        this.actionLoading = false;
        this.actionError   = err?.error?.message ?? 'Erreur lors du rejet.';
        this.cdr.detectChanges();
      }
    });
  }

  getStatutClass(statut: string): string {
    if (statut.startsWith('En attente')) return 'st-waiting';
    if (statut === 'Validée' || statut === 'Validée – En traitement RH' || statut === 'Clôturée') return 'st-valid';
    if (statut.startsWith('Rejetée') || statut === 'Annulée') return 'st-rejected';
    return 'st-neutral';
  }

  getTypeClass(type: string): string {
    if (type === 'conge') return 'type-conge';
    if (type === 'autorisation') return 'type-auto';
    return 'type-maladie';
  }
}
