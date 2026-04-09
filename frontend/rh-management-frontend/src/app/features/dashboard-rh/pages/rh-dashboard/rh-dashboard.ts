import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
export class RhDashboard {
  activeTab: TypeDemande = 'all';
  filterStatut = '';
  filterEmploye = '';
  filterDateDebut = '';
  filterDateFin = '';
  selectedDemande: DemandeRH | null = null;
  showRejectModal = false;
  rejectMotif = '';
  actionLoading = false;

  readonly kpis = {
    total: 152,
    enAttente: 18,
    validees: 104,
    rejetees: 12,
    cloturees: 18
  };

  demandes: DemandeRH[] = [
    {
      id: 1,
      refNo: '#CON-2026-001',
      type: 'conge',
      sousType: 'Congé annuel',
      employe: 'Amine Kani',
      matricule: 'EMP-2026-014',
      direction: 'Direction Finance',
      dateCreation: '2026-04-01',
      dateDebut: '2026-04-15',
      dateFin: '2026-04-20',
      duree: '5 jours',
      motif: 'Voyage familial',
      statut: 'Validée – En traitement RH'
    },
    {
      id: 2,
      refNo: '#AUT-2026-007',
      type: 'autorisation',
      sousType: 'Personnelle',
      employe: 'Sara Trabelsi',
      matricule: 'EMP-2026-022',
      direction: 'Direction Commerciale',
      dateCreation: '2026-04-03',
      dateDebut: '2026-04-05',
      duree: '01h 30',
      motif: 'Rendez-vous médical',
      statut: 'Validée'
    },
    {
      id: 3,
      refNo: '#MAL-2026-003',
      type: 'maladie',
      sousType: 'Maladie simple',
      employe: 'Mohamed Kacem',
      matricule: 'EMP-2026-031',
      direction: 'Direction Finance',
      dateCreation: '2026-03-28',
      dateDebut: '2026-03-28',
      dateFin: '2026-04-02',
      duree: '6 jours',
      motif: 'Grippe',
      statut: 'En attente de validation RH',
      certificat: 'certificat-kacem-mar26.pdf'
    },
    {
      id: 4,
      refNo: '#CON-2026-002',
      type: 'conge',
      sousType: 'Congé exceptionnel',
      employe: 'Nadia Bouhajeb',
      matricule: 'EMP-2026-019',
      direction: 'DRH',
      dateCreation: '2026-03-30',
      dateDebut: '2026-04-10',
      dateFin: '2026-04-11',
      duree: '2 jours',
      motif: 'Mariage dans la famille',
      statut: 'En attente de validation N+1'
    },
    {
      id: 5,
      refNo: '#MAL-2026-002',
      type: 'maladie',
      sousType: 'Congé maternité',
      employe: 'Leila Mansouri',
      matricule: 'EMP-2026-007',
      direction: 'Direction Technique',
      dateCreation: '2026-03-15',
      dateDebut: '2026-03-20',
      dateFin: '2026-06-12',
      duree: '84 jours',
      motif: 'Congé maternité légal',
      statut: 'Validée',
      certificat: 'cert-maternite-mansouri.pdf'
    }
  ];

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
    setTimeout(() => {
      const d = this.demandes.find(x => x.id === this.selectedDemande!.id);
      if (d) d.statut = 'Clôturée';
      this.actionLoading = false;
      this.selectedDemande = null;
    }, 500);
  }

  validerMaladie(): void {
    if (!this.selectedDemande) return;
    this.actionLoading = true;
    setTimeout(() => {
      const d = this.demandes.find(x => x.id === this.selectedDemande!.id);
      if (d) d.statut = 'Validée';
      this.actionLoading = false;
      this.selectedDemande = null;
    }, 500);
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
    setTimeout(() => {
      const d = this.demandes.find(x => x.id === this.selectedDemande!.id);
      if (d) d.statut = 'Rejetée';
      this.actionLoading = false;
      this.showRejectModal = false;
      this.selectedDemande = null;
    }, 500);
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
