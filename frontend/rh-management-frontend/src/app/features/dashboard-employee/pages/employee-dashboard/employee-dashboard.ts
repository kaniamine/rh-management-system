import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
export class EmployeeDashboard {
  activeTab: TypeDemande = 'all';
  filterStatut = '';
  selectedDemande: Demande | null = null;

  readonly stats = {
    soldeConges: 12,
    enAttente: 3,
    validees: 8,
    rejetees: 1
  };

  readonly demandes: Demande[] = [
    {
      id: 1,
      refNo: '#CON-2026-001',
      type: 'conge',
      sousType: 'Congé annuel',
      dateCreation: '2026-04-01',
      dateDebut: '2026-04-15',
      dateFin: '2026-04-20',
      duree: '5 jours',
      motif: 'Voyage familial',
      statut: 'En attente de validation N+1'
    },
    {
      id: 2,
      refNo: '#AUT-2026-007',
      type: 'autorisation',
      sousType: 'Personnelle',
      dateCreation: '2026-03-20',
      dateDebut: '2026-03-21',
      duree: '01h 30',
      motif: 'Rendez-vous médical',
      statut: 'Validée'
    },
    {
      id: 3,
      refNo: '#MAL-2026-001',
      type: 'maladie',
      sousType: 'Maladie simple',
      dateCreation: '2026-03-10',
      dateDebut: '2026-03-10',
      dateFin: '2026-03-15',
      duree: '6 jours',
      motif: 'Grippe — certificat médical joint',
      statut: 'Validée'
    },
    {
      id: 4,
      refNo: '#CON-2026-002',
      type: 'conge',
      sousType: 'Congé exceptionnel',
      dateCreation: '2026-02-28',
      dateDebut: '2026-03-05',
      dateFin: '2026-03-06',
      duree: '2 jours',
      motif: 'Mariage dans la famille',
      statut: 'Rejetée par le supérieur hiérarchique'
    }
  ];

  get filteredDemandes(): Demande[] {
    return this.demandes.filter(d => {
      const matchTab = this.activeTab === 'all' || d.type === this.activeTab;
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
      conge: '🏖',
      autorisation: '🕐',
      maladie: '🏥'
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
      d.statut === 'En attente de validation N+1' ||
      d.statut === 'En attente de validation du supérieur hiérarchique' ||
      d.statut === 'Brouillon'
    );
  }
}
