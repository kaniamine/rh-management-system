import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
<<<<<<< HEAD
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
=======
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth.service';
import { Conge } from '../../../conge/services/conge';
import { Autorisation } from '../../../conge/services/autorisation';
import { Maladie } from '../../../conge/services/maladie';
>>>>>>> f5bff9c669c5aaa936f5ed647a6f3abda4250a77

type TypeDemande = 'conge' | 'autorisation' | 'maladie' | 'all';

interface DemandeRH {
  id: number;
  refNo: string;
  type: TypeDemande;
  sousType: string;
  employe: string;
  matricule: string;
  direction: string;
  dateCreation: string;
  dateDebut: string;
  dateFin?: string;
  duree: string;
  motif: string;
  statut: string;
  certificat?: string;
}

@Component({
  selector: 'app-rh-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './rh-dashboard.html',
  styleUrl: './rh-dashboard.css'
})
export class RhDashboard implements OnInit {
  private readonly auth           = inject(AuthService);
  private readonly congeService   = inject(Conge);
  private readonly autoService    = inject(Autorisation);
  private readonly maladieService = inject(Maladie);

  loading = true;
  activeTab: TypeDemande = 'all';
  filterStatut = '';
  filterEmploye = '';
  filterDateDebut = '';
  filterDateFin = '';
  selectedDemande: DemandeRH | null = null;
  showRejectModal = false;
  rejectMotif = '';
  actionLoading = false;

  kpis = {
    total: 0,
    enAttente: 0,
    validees: 0,
    rejetees: 0,
    cloturees: 0
  };

  demandes: DemandeRH[] = [];

<<<<<<< HEAD
=======
  get kpis() {
    return {
      total:     this.demandes.length,
      enAttente: this.demandes.filter(d => d.statut.startsWith('En attente')).length,
      validees:  this.demandes.filter(d =>
        d.statut === 'Validée' || d.statut === 'Validée – En traitement RH'
      ).length,
      rejetees:  this.demandes.filter(d => d.statut.startsWith('Rejetée')).length,
      cloturees: this.demandes.filter(d => d.statut === 'Clôturée').length
    };
  }

>>>>>>> f5bff9c669c5aaa936f5ed647a6f3abda4250a77
  ngOnInit(): void {
    this.loadAll();
  }

<<<<<<< HEAD
  loadAll(): void {
    forkJoin({
      conges:        this.http.get<any[]>(`${this.API}/api/demandes-conge`),
      autorisations: this.http.get<any[]>(`${this.API}/api/autorisations-sortie`),
      maladies:      this.http.get<any[]>(`${this.API}/api/demandes-maladie`)
    }).subscribe({
      next: ({ conges, autorisations, maladies }) => {
        const mapped: DemandeRH[] = [
          ...conges.map(d => ({
            id:           d.id,
            refNo:        `#CON-${d.id}`,
            type:         'conge' as TypeDemande,
            sousType:     d.typeConge,
            employe:      d.nomComplet,
            matricule:    d.matricule,
            direction:    d.service ?? '',
            dateCreation: d.createdAt?.substring(0, 10) ?? '',
            dateDebut:    d.dateDebut,
            dateFin:      d.dateFin,
            duree:        d.dureeJours + ' j',
            motif:        d.motif ?? '',
            statut:       d.statut
          })),
          ...autorisations.map(d => ({
            id:           d.id,
            refNo:        `#AUT-${d.id}`,
            type:         'autorisation' as TypeDemande,
            sousType:     d.typeAutorisation,
            employe:      d.nomComplet ?? d.matricule,
            matricule:    d.matricule,
            direction:    d.direction ?? '',
            dateCreation: d.createdAt?.substring(0, 10) ?? '',
            dateDebut:    d.dateDemande,
            duree:        d.duree ?? '',
            motif:        d.motif ?? '',
            statut:       d.statut
          })),
          ...maladies.map(d => ({
            id:           d.id,
            refNo:        `#MAL-${d.id}`,
            type:         'maladie' as TypeDemande,
            sousType:     d.typeMaladie,
            employe:      d.matricule,
            matricule:    d.matricule,
            direction:    d.direction ?? '',
            dateCreation: d.createdAt?.substring(0, 10) ?? '',
            dateDebut:    d.dateDebut,
            dateFin:      d.dateFin,
            duree:        d.nombreJours + ' j',
            motif:        d.commentaire ?? '',
            statut:       d.statut,
            certificat:   d.certificatMedicalFichierNom
          }))
        ];

        this.demandes = mapped.sort((a, b) => b.dateCreation.localeCompare(a.dateCreation));
        this.updateKpis();
        this.loading = false;
=======
  loadDemandes(): void {
    forkJoin({
      conges:        this.congeService.getDemandes().pipe(catchError(() => of([]))),
      autorisations: this.autoService.getDemandes().pipe(catchError(() => of([]))),
      maladies:      this.maladieService.getDemandes().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ conges, autorisations, maladies }) => {
        const year = (d: any) => d.createdAt ? new Date(d.createdAt).getFullYear() : new Date().getFullYear();

        const mappedConges = (conges as any[]).map(d => ({
          id:           d.id,
          refNo:        `#CON-${year(d)}-${String(d.id).padStart(3, '0')}`,
          type:         'conge' as TypeDemande,
          sousType:     d.typeConge ?? '',
          employe:      d.nomComplet ?? '',
          matricule:    d.matricule ?? '',
          direction:    d.direction ?? d.service ?? '',
          dateCreation: d.createdAt ? d.createdAt.slice(0, 10) : '',
          dateDebut:    d.dateDebut ?? '',
          dateFin:      d.dateFin ?? undefined,
          duree:        d.dureeJours != null ? `${d.dureeJours} jour${d.dureeJours > 1 ? 's' : ''}` : '',
          motif:        d.motif ?? '',
          statut:       d.statut ?? ''
        } as DemandeRH));

        const mappedAutorisations = (autorisations as any[]).map(d => ({
          id:           d.id,
          refNo:        `#AUT-${year(d)}-${String(d.id).padStart(3, '0')}`,
          type:         'autorisation' as TypeDemande,
          sousType:     d.typeAutorisation ?? '',
          employe:      d.nomComplet ?? '',
          matricule:    d.matricule ?? '',
          direction:    d.direction ?? d.service ?? '',
          dateCreation: d.createdAt ? d.createdAt.slice(0, 10) : '',
          dateDebut:    d.dateDemande ?? '',
          dateFin:      undefined,
          duree:        d.dureeCalculee ?? '',
          motif:        d.motif ?? '',
          statut:       d.statut ?? ''
        } as DemandeRH));

        const mappedMaladies = (maladies as any[]).map(d => ({
          id:           d.id,
          refNo:        `#MAL-${year(d)}-${String(d.id).padStart(3, '0')}`,
          type:         'maladie' as TypeDemande,
          sousType:     d.typeMaladie ?? '',
          employe:      d.nomComplet ?? '',
          matricule:    d.matricule ?? '',
          direction:    d.direction ?? d.service ?? '',
          dateCreation: d.createdAt ? d.createdAt.slice(0, 10) : '',
          dateDebut:    d.dateDebut ?? '',
          dateFin:      d.dateFin ?? undefined,
          duree:        d.nombreJours != null ? `${d.nombreJours} jour${d.nombreJours > 1 ? 's' : ''}` : '',
          motif:        d.commentaire ?? '',
          statut:       d.statut ?? '',
          certificat:   d.certificatMedicalUrl ?? undefined
        } as DemandeRH));

        this.demandes = [...mappedConges, ...mappedAutorisations, ...mappedMaladies]
          .sort((a, b) => b.dateCreation.localeCompare(a.dateCreation));
>>>>>>> f5bff9c669c5aaa936f5ed647a6f3abda4250a77
      },
      error: () => {
        this.loading = false;
      }
    });
  }

<<<<<<< HEAD
  private updateKpis(): void {
    this.kpis.total     = this.demandes.length;
    this.kpis.enAttente = this.demandes.filter(d => d.statut.startsWith('En attente')).length;
    this.kpis.validees  = this.demandes.filter(d => d.statut === 'Validée' || d.statut.includes('traitement')).length;
    this.kpis.rejetees  = this.demandes.filter(d => d.statut.startsWith('Rejetée')).length;
    this.kpis.cloturees = this.demandes.filter(d => d.statut === 'Clôturée').length;
  }

  private endpointFor(type: TypeDemande): string {
    if (type === 'maladie')      return `${this.API}/api/demandes-maladie`;
    if (type === 'autorisation') return `${this.API}/api/autorisations-sortie`;
    return `${this.API}/api/demandes-conge`;
  }

  get filteredDemandes(): DemandeRH[] {
    const q = this.filterEmploye.toLowerCase();
    return this.demandes.filter(d => {
      const matchTab     = this.activeTab === 'all' || d.type === this.activeTab;
      const matchStatut  = !this.filterStatut  || d.statut === this.filterStatut;
      const matchEmploye = !q || d.employe.toLowerCase().includes(q) || d.matricule.toLowerCase().includes(q);
      const matchDate    = !this.filterDateDebut || d.dateCreation >= this.filterDateDebut;
      const matchDateFin = !this.filterDateFin   || d.dateCreation <= this.filterDateFin;
=======
  get filteredDemandes(): DemandeRH[] {
    const q = this.filterEmploye.toLowerCase();
    return this.demandes.filter(d => {
      const matchTab      = this.activeTab === 'all' || d.type === this.activeTab;
      const matchStatut   = !this.filterStatut   || d.statut === this.filterStatut;
      const matchEmploye  = !q || d.employe.toLowerCase().includes(q) || d.matricule.toLowerCase().includes(q);
      const matchDate     = !this.filterDateDebut || d.dateCreation >= this.filterDateDebut;
      const matchDateFin  = !this.filterDateFin   || d.dateCreation <= this.filterDateFin;
>>>>>>> f5bff9c669c5aaa936f5ed647a6f3abda4250a77
      return matchTab && matchStatut && matchEmploye && matchDate && matchDateFin;
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
    const icons: Record<string, string> = { conge: '🏖', autorisation: '🕐', maladie: '🏥' };
    return icons[type] ?? '📄';
  }

  openDetail(d: DemandeRH): void {
    this.selectedDemande = d;
    this.showRejectModal = false;
    this.rejectMotif = '';
  }

  closeDetail(): void {
    this.selectedDemande = null;
    this.showRejectModal = false;
  }

<<<<<<< HEAD
  validerMaladie(): void {
    if (!this.selectedDemande) return;
    this.actionLoading = true;
    const d = this.selectedDemande;
    const newStatut = 'Validée';
    this.http
      .patch(`${this.endpointFor(d.type)}/${d.id}/statut`, { statut: newStatut })
      .subscribe({
        next: () => {
          d.statut = newStatut;
          this.updateKpis();
          this.actionLoading = false;
          this.selectedDemande = null;
        },
        error: () => { this.actionLoading = false; }
      });
  }

  cloturer(): void {
    if (!this.selectedDemande) return;
    this.actionLoading = true;
    const d = this.selectedDemande;
    const newStatut = 'Clôturée';
    this.http
      .patch(`${this.API}/api/demandes-conge/${d.id}/statut`, { statut: newStatut })
      .subscribe({
        next: () => {
          d.statut = newStatut;
          this.updateKpis();
          this.actionLoading = false;
          this.selectedDemande = null;
        },
        error: () => { this.actionLoading = false; }
      });
=======
  cloturer(): void {
    if (!this.selectedDemande) return;
    this.actionLoading = true;
    const { id, type } = this.selectedDemande;
    const matricule = this.auth.session?.matricule ?? '';

    // Seul le congé a un endpoint /cloturer dédié ; pour les autres on utilise PATCH statut
    const obs$ = type === 'conge'
      ? this.congeService.cloturer(id, matricule)
      : (type === 'maladie'
          ? this.maladieService.valider(id, matricule)
          : this.autoService.validerN1(id, matricule));

    obs$.subscribe({
      next: () => {
        this.actionLoading = false;
        this.selectedDemande = null;
        this.loadDemandes();
      },
      error: () => { this.actionLoading = false; }
    });
  }

  validerMaladie(): void {
    if (!this.selectedDemande) return;
    this.actionLoading = true;
    const matricule = this.auth.session?.matricule ?? '';
    this.maladieService.valider(this.selectedDemande.id, matricule).subscribe({
      next: () => {
        this.actionLoading = false;
        this.selectedDemande = null;
        this.loadDemandes();
      },
      error: () => { this.actionLoading = false; }
    });
>>>>>>> f5bff9c669c5aaa936f5ed647a6f3abda4250a77
  }

  openRejectModal(): void {
    this.showRejectModal = true;
    this.rejectMotif = '';
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectMotif = '';
  }

  rejeter(): void {
    if (!this.selectedDemande || !this.rejectMotif.trim()) return;
    this.actionLoading = true;
<<<<<<< HEAD
    const d = this.selectedDemande;
    const newStatut = 'Rejetée';
    this.http
      .patch(`${this.endpointFor(d.type)}/${d.id}/statut`, { statut: newStatut, motif: this.rejectMotif })
      .subscribe({
        next: () => {
          d.statut = newStatut;
          this.updateKpis();
          this.actionLoading = false;
          this.showRejectModal = false;
          this.rejectMotif = '';
          this.selectedDemande = null;
        },
        error: () => { this.actionLoading = false; }
      });
=======
    const { id, type } = this.selectedDemande;
    const matricule = this.auth.session?.matricule ?? '';

    const obs$ = type === 'maladie'
      ? this.maladieService.rejeter(id, matricule, this.rejectMotif)
      : this.congeService.rejeterN1(id, matricule, this.rejectMotif);

    obs$.subscribe({
      next: () => {
        this.actionLoading = false;
        this.showRejectModal = false;
        this.selectedDemande = null;
        this.loadDemandes();
      },
      error: () => { this.actionLoading = false; }
    });
>>>>>>> f5bff9c669c5aaa936f5ed647a6f3abda4250a77
  }

  canCloturer(d: DemandeRH): boolean {
    return d.statut === 'Validée – En traitement RH' || d.statut === 'Validée';
  }

  canValiderMaladie(d: DemandeRH): boolean {
    return d.type === 'maladie' && d.statut === 'En attente de validation RH';
  }

  canReject(d: DemandeRH): boolean {
    return d.statut.startsWith('En attente') || d.statut === 'Validée – En traitement RH';
  }

  exportCSV(): void {
    const rows = [
      ['Réf', 'Type', 'Employé', 'Matricule', 'Direction', 'Début', 'Fin', 'Durée', 'Statut'],
      ...this.filteredDemandes.map(d => [
        d.refNo, d.sousType, d.employe, d.matricule, d.direction,
        d.dateDebut, d.dateFin ?? '', d.duree, d.statut
      ])
    ];
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demandes-rh-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
