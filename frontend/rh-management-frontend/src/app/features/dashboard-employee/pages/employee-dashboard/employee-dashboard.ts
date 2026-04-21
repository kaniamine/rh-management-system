import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/auth.service';
import { Conge } from '../../../conge/services/conge';
import { Autorisation } from '../../../conge/services/autorisation';
import { Maladie } from '../../../conge/services/maladie';

type TypeDemande = 'conge' | 'autorisation' | 'maladie' | 'all';

interface Demande {
  id: number;
  refNo: string;
  type: TypeDemande;
  sousType: string;
  dateCreation: string;
  dateDebut: string;
  dateFin?: string;
  duree: string;
  statut: string;
  motif: string;
}

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css'
})
export class EmployeeDashboard implements OnInit {
  private readonly auth            = inject(AuthService);
  private readonly congeService    = inject(Conge);
  private readonly autoService     = inject(Autorisation);
  private readonly maladieService  = inject(Maladie);

  loading = true;
  activeTab: TypeDemande = 'all';
  filterStatut = '';
  selectedDemande: Demande | null = null;
  loadError: string | null = null;
  actionLoading = false;

  get stats() {
    const solde = this.auth.session?.soldeConges ?? 0;
    return {
      soldeConges: solde,
      enAttente:   this.demandes.filter(d => d.statut.startsWith('En attente')).length,
      validees:    this.demandes.filter(d =>
        d.statut === 'Validée' || d.statut === 'Validée – En traitement RH' || d.statut === 'Clôturée'
      ).length,
      rejetees:    this.demandes.filter(d => d.statut.startsWith('Rejetée')).length
    };
  }

  demandes: Demande[] = [];

  ngOnInit(): void {
    this.chargerDemandes();
  }

  chargerDemandes(): void {
    const matricule = this.auth.session?.matricule ?? '';
    this.loadError = null;

    forkJoin({
      conges:        this.congeService.getDemandes(matricule).pipe(catchError(() => of([]))),
      autorisations: this.autoService.getDemandes(matricule).pipe(catchError(() => of([]))),
      maladies:      this.maladieService.getDemandes(matricule).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ conges, autorisations, maladies }) => {
        const mappedConges = (conges as any[]).map(c => ({
          id:           c.id,
          refNo:        c.refNo ?? `#CON-${c.id}`,
          type:         'conge' as TypeDemande,
          sousType:     c.typeConge ?? '',
          dateCreation: c.createdAt?.substring(0, 10) ?? '',
          dateDebut:    c.dateDebut ?? '',
          dateFin:      c.dateFin ?? undefined,
          duree:        c.typeDuree ?? (c.dureeJours != null ? `${c.dureeJours} jour(s)` : ''),
          motif:        c.motif ?? '',
          statut:       c.statut ?? ''
        }));

        const mappedAutorisations = (autorisations as any[]).map(a => ({
          id:           a.id,
          refNo:        a.refNo ?? `#AUT-${a.id}`,
          type:         'autorisation' as TypeDemande,
          sousType:     a.typeAutorisation ?? '',
          dateCreation: a.createdAt?.substring(0, 10) ?? '',
          dateDebut:    a.dateDemande ?? '',
          dateFin:      undefined,
          duree:        a.dureeCalculee ?? '',
          motif:        a.motif ?? '',
          statut:       a.statut ?? ''
        }));

        const mappedMaladies = (maladies as any[]).map(m => ({
          id:           m.id,
          refNo:        m.refNo ?? `#MAL-${m.id}`,
          type:         'maladie' as TypeDemande,
          sousType:     m.typeMaladie ?? '',
          dateCreation: m.createdAt?.substring(0, 10) ?? '',
          dateDebut:    m.dateDebut ?? '',
          dateFin:      m.dateFin ?? undefined,
          duree:        m.nombreJours != null ? `${m.nombreJours} jour(s)` : '',
          motif:        m.commentaire ?? '',
          statut:       m.statut ?? ''
        }));

        this.demandes = [...mappedConges, ...mappedAutorisations, ...mappedMaladies]
          .sort((a, b) => b.dateCreation.localeCompare(a.dateCreation));
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loadError = err.error?.message ?? `Erreur ${err.status} lors du chargement.`;
        this.loading = false;
      }
    });
  }

  get filteredDemandes(): Demande[] {
    return this.demandes.filter(d => {
      const matchTab    = this.activeTab === 'all' || d.type === this.activeTab;
      const matchStatut = !this.filterStatut || d.statut === this.filterStatut;
      return matchTab && matchStatut;
    });
  }

  countByType(type: TypeDemande): number {
    return this.demandes.filter(d => d.type === type).length;
  }

  getStatutClass(statut: string): string {
    if (statut.startsWith('En attente')) return 'pending';
    if (statut === 'Validée' || statut === 'Clôturée' || statut === 'Validée – En traitement RH') return 'approved';
    if (statut.startsWith('Rejetée') || statut === 'Annulée') return 'rejected';
    return 'neutral';
  }

  getTypeIcon(type: TypeDemande): string {
    const icons: Record<string, string> = {
      conge:        '🏖',
      autorisation: '🕐',
      maladie:      '🏥'
    };
    return icons[type] ?? '📄';
  }

  openDetail(d: Demande): void {
    this.selectedDemande = d;
  }

  closeDetail(): void {
    this.selectedDemande = null;
  }

  canCancel(d: Demande): boolean {
    return (
      d.statut === 'Brouillon' ||
      d.statut === 'En attente de validation N+1' ||
      d.statut === 'En attente de validation du supérieur hiérarchique' ||
      d.statut === 'En attente de validation DG' ||
      d.statut === 'En attente de validation RH'
    );
  }

  annuler(d: Demande): void {
    if (!this.canCancel(d)) return;
    this.actionLoading = true;
    const matricule = this.auth.session?.matricule ?? '';

    let obs$;
    if (d.type === 'conge') {
      obs$ = this.congeService.annuler(d.id, matricule);
    } else if (d.type === 'autorisation') {
      obs$ = this.autoService.annuler(d.id, matricule);
    } else {
      obs$ = this.maladieService.annuler(d.id, matricule);
    }

    obs$.subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeDetail();
        this.chargerDemandes();
      },
      error: () => {
        this.actionLoading = false;
      }
    });
  }
}
