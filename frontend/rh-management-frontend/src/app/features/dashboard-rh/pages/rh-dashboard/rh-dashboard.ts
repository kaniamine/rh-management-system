import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

type StatutDemande = string;
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
  statut: StatutDemande;
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
  private readonly http = inject(HttpClient);
  private readonly API = 'http://localhost:5130';

  activeTab: TypeDemande = 'all';
  filterStatut = '';
  filterEmploye = '';
  filterDateDebut = '';
  filterDateFin = '';
  selectedDemande: DemandeRH | null = null;
  showRejectModal = false;
  rejectMotif = '';
  actionLoading = false;

  demandes: DemandeRH[] = [];

  get kpis() {
    return {
      total: this.demandes.length,
      enAttente: this.demandes.filter(d => d.statut.startsWith('En attente')).length,
      validees: this.demandes.filter(d =>
        d.statut === 'Validée' || d.statut === 'Validée – En traitement RH'
      ).length,
      rejetees: this.demandes.filter(d => d.statut.startsWith('Rejetée')).length,
      cloturees: this.demandes.filter(d => d.statut === 'Clôturée').length
    };
  }

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes(): void {
    this.http.get<any[]>(`${this.API}/api/demandes-conge`).subscribe({
      next: (data) => {
        this.demandes = data.map(d => this.mapDemande(d));
      },
      error: () => {
        this.demandes = [];
      }
    });
  }

  private mapDemande(d: any): DemandeRH {
    const type = this.inferType(d.typeConge ?? '');
    const prefix = type === 'maladie' ? 'MAL' : type === 'autorisation' ? 'AUT' : 'CON';
    const year = d.createdAt ? new Date(d.createdAt).getFullYear() : new Date().getFullYear();
    return {
      id: d.id,
      refNo: `#${prefix}-${year}-${String(d.id).padStart(3, '0')}`,
      type,
      sousType: d.typeConge ?? '',
      employe: d.nomComplet ?? '',
      matricule: d.matricule ?? '',
      direction: d.service ?? '',
      dateCreation: d.createdAt ? d.createdAt.slice(0, 10) : '',
      dateDebut: d.dateDebut ?? '',
      dateFin: d.dateFin ?? undefined,
      duree: d.dureeJours != null ? `${d.dureeJours} jour${d.dureeJours > 1 ? 's' : ''}` : '',
      motif: d.motif ?? '',
      statut: d.statut ?? ''
    };
  }

  private inferType(typeConge: string): TypeDemande {
    const tc = typeConge.toLowerCase();
    if (tc.includes('maladie') || tc.includes('maternit')) return 'maladie';
    if (tc.includes('autorisation')) return 'autorisation';
    return 'conge';
  }

  get filteredDemandes(): DemandeRH[] {
    const q = this.filterEmploye.toLowerCase();
    return this.demandes.filter(d => {
      const matchTab = this.activeTab === 'all' || d.type === this.activeTab;
      const matchStatut = !this.filterStatut || d.statut === this.filterStatut;
      const matchEmploye = !q || d.employe.toLowerCase().includes(q) || d.matricule.toLowerCase().includes(q);
      const matchDate = !this.filterDateDebut || d.dateCreation >= this.filterDateDebut;
      const matchDateFin = !this.filterDateFin || d.dateCreation <= this.filterDateFin;
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

  cloturer(): void {
    if (!this.selectedDemande) return;
    this.actionLoading = true;
    const id = this.selectedDemande.id;
    this.http
      .patch(`${this.API}/api/demandes-conge/${id}/statut`, { statut: 'Clôturée' })
      .subscribe({
        next: () => {
          this.actionLoading = false;
          this.selectedDemande = null;
          this.loadDemandes();
        },
        error: () => {
          this.actionLoading = false;
        }
      });
  }

  validerMaladie(): void {
    if (!this.selectedDemande) return;
    this.actionLoading = true;
    const id = this.selectedDemande.id;
    this.http
      .patch(`${this.API}/api/demandes-conge/${id}/statut`, { statut: 'Validée' })
      .subscribe({
        next: () => {
          this.actionLoading = false;
          this.selectedDemande = null;
          this.loadDemandes();
        },
        error: () => {
          this.actionLoading = false;
        }
      });
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
    const id = this.selectedDemande.id;
    this.http
      .patch(`${this.API}/api/demandes-conge/${id}/statut`, { statut: 'Rejetée', motif: this.rejectMotif })
      .subscribe({
        next: () => {
          this.actionLoading = false;
          this.showRejectModal = false;
          this.selectedDemande = null;
          this.loadDemandes();
        },
        error: () => {
          this.actionLoading = false;
        }
      });
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
