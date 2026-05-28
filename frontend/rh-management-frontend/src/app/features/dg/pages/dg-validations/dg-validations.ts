import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth.service';

interface DemandeConge {
  id: number;
  refNo: string;
  sousType: string;
  employe: string;
  matricule: string;
  direction: string;
  service: string;
  superieurN1: string;
  dateCreation: string;
  dateDebut: string;
  dateFin: string;
  duree: string;
  motif: string;
  adresse?: string;
  telephone?: string;
  statut: string;
  validationN1?: { par: string; le: string; commentaire?: string };
}

@Component({
  selector: 'app-dg-validations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dg-validations.html',
  styleUrls: ['./dg-validations.css']
})
export class DgValidations implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly cdr  = inject(ChangeDetectorRef);
  private readonly API  = 'http://localhost:5131';

  activeTab: 'validation' | 'historique' = 'validation';

  loading       = false;
  erreur        = '';
  filterStatut  = '';
  filterEmploye = '';
  selectedDemande: DemandeConge | null = null;
  showApproveModal = false;
  showRejectModal  = false;
  rejectMotif      = '';
  approveComment   = '';
  actionLoading    = false;

  historyLoading = false;
  historyDemandes: any[] = [];
  historyFilterType: 'all' | 'conge' | 'autorisation' | 'maladie' = 'all';
  historyFilterStatut = '';

  get dg() {
    return {
      nom:       this.auth.session?.nomComplet ?? '',
      initiales: this.auth.session?.initiales  ?? 'DG'
    };
  }

  demandes: any[] = [];

  ngOnInit(): void {
    this.loadDemandes();
  }

  switchTab(tab: 'validation' | 'historique'): void {
    this.activeTab = tab;
    if (tab === 'historique' && this.historyDemandes.length === 0 && !this.historyLoading) {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    this.historyLoading = true;
    forkJoin({
      conges:        this.http.get<any[]>(`${this.API}/api/demandes-conge`).pipe(catchError(() => of([]))),
      autorisations: this.http.get<any[]>(`${this.API}/api/demandes-autorisation`).pipe(catchError(() => of([]))),
      maladies:      this.http.get<any[]>(`${this.API}/api/demandes-maladie`).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ conges, autorisations, maladies }) => {
        const mc = (conges as any[]).map(d => ({ ...d, typeKey: 'conge',        typeLabel: 'Congé',        nomComplet: d.nomComplet ?? d.employe ?? '', dateRef: d.createdAt ?? '' }));
        const ma = (autorisations as any[]).map(d => ({ ...d, typeKey: 'autorisation', typeLabel: 'Autorisation', nomComplet: d.nomComplet ?? d.employe ?? '', dateDebut: d.dateDemande ?? d.dateDebut, dateRef: d.createdAt ?? '' }));
        const mm = (maladies as any[]).map(d => ({ ...d, typeKey: 'maladie',     typeLabel: 'Maladie',      nomComplet: d.nomComplet ?? d.employe ?? '', dateRef: d.createdAt ?? '' }));
        this.historyDemandes = [...mc, ...ma, ...mm].sort((a, b) => (b.dateRef ?? '').localeCompare(a.dateRef ?? ''));
        this.historyLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur historique DG:', err);
        this.erreur         = 'Impossible de charger l\'historique.';
        this.historyLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredHistory(): any[] {
    return this.historyDemandes.filter(d => {
      const matchType   = this.historyFilterType === 'all' || d.typeKey === this.historyFilterType;
      const matchStatut = !this.historyFilterStatut || d.statut === this.historyFilterStatut;
      return matchType && matchStatut;
    });
  }

  getHistoryStatutClass(statut: string): string {
    if (statut?.startsWith('En attente')) return 'waiting';
    if (statut === 'Validée – En traitement RH' || statut === 'Clôturée' || statut === 'Validée') return 'valid';
    if (statut?.startsWith('Rejetée') || statut === 'Annulée') return 'rejected';
    return 'neutral';
  }

  loadDemandes(): void {
    this.loading = true;
    this.erreur  = '';
    this.http.get<any[]>(
      `${this.API}/api/demandes-conge?statut=En%20attente%20de%20validation%20DG`
    ).subscribe({
      next: (data) => {
        this.demandes = data.sort((a, b) =>
          new Date(a.dateCreation ?? a.dateSoumission ?? 0).getTime() -
          new Date(b.dateCreation ?? b.dateSoumission ?? 0).getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur validation DG:', err);
        this.erreur  = 'Impossible de charger les demandes.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredDemandes(): any[] {
    const q = this.filterEmploye.toLowerCase();
    return this.demandes.filter((d: any) => {
      const matchStatut  = !this.filterStatut  || d.statut === this.filterStatut;
      const matchEmploye = !q || (d.employe ?? d.nomComplet ?? '').toLowerCase().includes(q)
                               || (d.matricule ?? '').toLowerCase().includes(q);
      return matchStatut && matchEmploye;
    });
  }

  get pendingCount(): number {
    return this.demandes.filter((d: any) => d.statut === 'En attente de validation DG').length;
  }

  get validatedCount(): number {
    return this.demandes.filter((d: any) =>
      d.statut === 'Validée – En traitement RH' || d.statut === 'Clôturée'
    ).length;
  }

  get rejectedCount(): number {
    return this.demandes.filter((d: any) => d.statut === 'Rejetée par la Direction Générale').length;
  }

  isPending(d: any): boolean {
    return d.statut === 'En attente de validation DG';
  }

  getStatutClass(statut: string): string {
    if (statut.startsWith('En attente')) return 'waiting';
    if (statut === 'Validée – En traitement RH' || statut === 'Clôturée') return 'valid';
    if (statut.startsWith('Rejetée') || statut === 'Annulée') return 'rejected';
    return 'neutral';
  }

  selectDemande(d: DemandeConge): void {
    this.selectedDemande = d;
    this.showApproveModal = false;
    this.showRejectModal  = false;
    this.rejectMotif      = '';
    this.approveComment   = '';
  }

  closeDetail(): void {
    this.selectedDemande = null;
    this.showApproveModal = false;
    this.showRejectModal  = false;
  }

  openApproveModal(): void {
    this.showApproveModal = true;
    this.showRejectModal  = false;
  }

  openRejectModal(): void {
    this.showRejectModal  = true;
    this.showApproveModal = false;
    this.rejectMotif      = '';
  }

  closeModals(): void {
    this.showApproveModal = false;
    this.showRejectModal  = false;
    this.rejectMotif      = '';
    this.approveComment   = '';
  }

  approuver(): void {
    if (!this.selectedDemande) return;
    const id = this.selectedDemande.id;
    this.actionLoading = true;
    this.http.post(`${this.API}/api/demandes-conge/${id}/valider-dg`, {
      auteurMatricule: this.auth.session?.matricule ?? '',
      commentaire:     this.approveComment ?? ''
    }).subscribe({
      next: () => {
        this.actionLoading    = false;
        this.showApproveModal = false;
        this.selectedDemande  = null;
        this.approveComment   = '';
        this.cdr.detectChanges();
        this.loadDemandes();
      },
      error: () => { this.actionLoading = false; this.cdr.detectChanges(); }
    });
  }

  rejeter(): void {
    if (!this.selectedDemande || !this.rejectMotif.trim()) return;
    const id = this.selectedDemande.id;
    this.actionLoading = true;
    this.http.post(`${this.API}/api/demandes-conge/${id}/rejeter-dg`, {
      auteurMatricule: this.auth.session?.matricule ?? '',
      commentaire:     this.rejectMotif
    }).subscribe({
      next: () => {
        this.actionLoading   = false;
        this.showRejectModal = false;
        this.selectedDemande = null;
        this.rejectMotif     = '';
        this.cdr.detectChanges();
        this.loadDemandes();
      },
      error: () => { this.actionLoading = false; this.cdr.detectChanges(); }
    });
  }
}
