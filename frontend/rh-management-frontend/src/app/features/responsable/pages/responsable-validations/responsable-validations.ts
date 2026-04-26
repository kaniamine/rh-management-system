import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth.service';
import { Conge } from '../../../conge/services/conge';
import { Autorisation } from '../../../conge/services/autorisation';
import { SignaturePad, LeaveRequestSummary, SignatureResult } from '../../../../shared/components/signature-pad/signature-pad';

type StatutDemande =
  | 'En attente de validation N+1'
  | 'En attente de validation DG'
  | 'Validée – En traitement RH'
  | 'Rejetée par le supérieur hiérarchique'
  | 'Rejetée par la Direction Générale'
  | 'Clôturée'
  | 'Annulée'
  | 'En attente de validation du supérieur hiérarchique'
  | 'Validée'
  | 'Rejetée'
  | 'En attente de validation RH';

type TypeDemande = 'conge' | 'autorisation' | 'maladie';

interface Demande {
  id: number;
  refNo: string;
  type: TypeDemande;
  typeLabel: string;
  sousType: string;
  employe: string;
  matricule: string;
  service: string;
  dateCreation: string;
  dateDebut: string;
  dateFin?: string;
  heureDepart?: string;
  heureRetour?: string;
  duree?: string;
  motif: string;
  statut: StatutDemande;
}

@Component({
  selector: 'app-responsable-validations',
  standalone: true,
  imports: [CommonModule, FormsModule, SignaturePad],
  templateUrl: './responsable-validations.html',
  styleUrls: ['./responsable-validations.css']
})
export class ResponsableValidations implements OnInit {
  private readonly congeService = inject(Conge);
  private readonly autoService  = inject(Autorisation);
  private readonly auth         = inject(AuthService);

  loading = true;

  get responsable() {
    return {
      nomComplet:  this.auth.session?.nomComplet ?? '',
      matricule:   this.auth.session?.matricule  ?? '',
      initiales:   this.auth.session?.initiales  ?? '',
      service:     this.auth.session?.service    ?? '',
      equipeCount: 0
    };
  }

  activeTab: TypeDemande | 'all' = 'all';
  selectedDemande: Demande | null = null;
  showRejectModal  = false;
  showApproveModal = false;
  showSignaturePad = false;
  rejectMotif      = '';
  actionLoading    = false;
  filterStatut     = '';
  signatureRequest: LeaveRequestSummary | null = null;

  demandes: Demande[] = [];

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes(): void {
    forkJoin({
      conges: this.congeService.getDemandes(undefined, 'En attente de validation N+1')
        .pipe(catchError(() => of([]))),
      autorisations: this.autoService.getDemandes(undefined, 'En attente de validation du supérieur hiérarchique')
        .pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ conges, autorisations }) => {
        const mappedConges = (conges as any[]).map(d => ({
          id:           d.id,
          refNo:        `#CON-${d.id}`,
          type:         'conge' as TypeDemande,
          typeLabel:    'Congé',
          sousType:     d.typeConge,
          employe:      d.nomComplet,
          matricule:    d.matricule,
          service:      d.service,
          dateCreation: d.createdAt?.substring(0, 10),
          dateDebut:    d.dateDebut,
          dateFin:      d.dateFin,
          duree:        d.dureeJours != null ? `${d.dureeJours} jours` : '',
          motif:        d.motif ?? '',
          statut:       d.statut
        } as Demande));

        const mappedAutorisations = (autorisations as any[]).map(d => ({
          id:           d.id,
          refNo:        `#AUT-${d.id}`,
          type:         'autorisation' as TypeDemande,
          typeLabel:    'Autorisation',
          sousType:     d.typeAutorisation ?? '',
          employe:      d.nomComplet,
          matricule:    d.matricule,
          service:      d.service,
          dateCreation: d.createdAt?.substring(0, 10),
          dateDebut:    d.dateDemande ?? '',
          dateFin:      undefined,
          heureDepart:  d.heureSortie,
          heureRetour:  d.heureRetour,
          duree:        d.dureeCalculee ?? '',
          motif:        d.motif ?? '',
          statut:       d.statut
        } as Demande));

        this.demandes = [...mappedConges, ...mappedAutorisations];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filteredDemandes(): Demande[] {
    return this.demandes.filter((d: Demande) => {
      const matchTab    = this.activeTab === 'all' || d.type === this.activeTab;
      const matchStatut = !this.filterStatut || d.statut === this.filterStatut;
      return matchTab && matchStatut;
    });
  }

  countByType(type: TypeDemande): number {
    return this.demandes.filter((d: Demande) => d.type === type).length;
  }

  get pendingCount(): number {
    return this.demandes.filter((d: Demande) =>
      d.statut === 'En attente de validation N+1' ||
      d.statut === 'En attente de validation du supérieur hiérarchique'
    ).length;
  }

  get totalCount(): number {
    return this.demandes.length;
  }

  selectDemande(d: Demande): void {
    this.selectedDemande = d;
    this.showRejectModal = false;
    this.showApproveModal = false;
    this.rejectMotif = '';
  }

  closeDetail(): void {
    this.selectedDemande = null;
    this.showRejectModal = false;
    this.showApproveModal = false;
  }

  openApproveModal(): void {
    if (!this.selectedDemande) return;
    if (this.selectedDemande.type === 'conge') {
      this.signatureRequest = {
        refNo:       this.selectedDemande.refNo,
        employeeNom: this.selectedDemande.employe,
        type:        this.selectedDemande.sousType,
        dateDebut:   this.selectedDemande.dateDebut,
        dateFin:     this.selectedDemande.dateFin ?? '—',
        motif:       this.selectedDemande.motif
      };
      this.showSignaturePad = true;
      this.showApproveModal = false;
    } else {
      this.showApproveModal = true;
      this.showSignaturePad = false;
    }
    this.showRejectModal = false;
  }

  onSigned(_result: SignatureResult): void {
    this.showSignaturePad = false;
    this.signatureRequest = null;
    this.approuveDemande();
  }

  onSignatureRejected(): void {
    this.showSignaturePad = false;
    this.signatureRequest = null;
    this.openRejectModal();
  }

  onSignatureCancelled(): void {
    this.showSignaturePad = false;
    this.signatureRequest = null;
  }

  openRejectModal(): void {
    this.showRejectModal = true;
    this.showApproveModal = false;
    this.rejectMotif = '';
  }

  closeModals(): void {
    this.showApproveModal = false;
    this.showRejectModal  = false;
    this.showSignaturePad = false;
    this.signatureRequest = null;
    this.rejectMotif      = '';
  }

  approuveDemande(): void {
    if (!this.selectedDemande) return;
    const { id, type } = this.selectedDemande;
    const matricule = this.auth.session?.matricule ?? '';
    this.actionLoading = true;

    const obs$ = type === 'autorisation'
      ? this.autoService.validerN1(id, matricule)
      : this.congeService.validerN1(id, matricule, '');

    obs$.subscribe({
      next: () => {
        this.actionLoading    = false;
        this.showApproveModal = false;
        this.selectedDemande  = null;
        this.loadDemandes();
      },
      error: () => { this.actionLoading = false; }
    });
  }

  rejeteDemande(): void {
    if (!this.selectedDemande || !this.rejectMotif.trim()) return;
    const { id, type } = this.selectedDemande;
    const matricule = this.auth.session?.matricule ?? '';
    this.actionLoading = true;

    const obs$ = type === 'autorisation'
      ? this.autoService.rejeterN1(id, matricule, this.rejectMotif)
      : this.congeService.rejeterN1(id, matricule, this.rejectMotif);

    obs$.subscribe({
      next: () => {
        this.actionLoading   = false;
        this.showRejectModal = false;
        this.selectedDemande = null;
        this.rejectMotif     = '';
        this.loadDemandes();
      },
      error: () => { this.actionLoading = false; }
    });
  }

  isPendingValidation(d: Demande): boolean {
    return (
      d.statut === 'En attente de validation N+1' ||
      d.statut === 'En attente de validation du supérieur hiérarchique'
    );
  }

  getStatutClass(statut: string): string {
    if (statut.startsWith('En attente')) return 'waiting';
    if (statut === 'Validée' || statut === 'Validée – En traitement RH' || statut === 'Clôturée') return 'valid';
    if (statut.startsWith('Rejetée') || statut === 'Annulée') return 'rejected';
    return 'neutral';
  }

  getTypeClass(type: TypeDemande): string {
    const map: Record<TypeDemande, string> = {
      conge:        'type-conge',
      autorisation: 'type-auto',
      maladie:      'type-maladie'
    };
    return map[type];
  }
}
