import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './responsable-validations.html',
  styleUrls: ['./responsable-validations.css']
})
export class ResponsableValidations {
  // Responsable connecté
  readonly responsable = {
    nomComplet: 'Ahmed Ben Ali',
    matricule: 'MGR-2026-001',
    service: 'Direction Finance',
    equipeCount: 8
  };

  activeTab: TypeDemande | 'all' = 'all';
  selectedDemande: Demande | null = null;
  showRejectModal = false;
  showApproveModal = false;
  rejectMotif = '';
  actionLoading = false;
  filterStatut = '';

  // Données de démonstration — seront remplacées par des appels API
  demandes: Demande[] = [
    {
      id: 1,
      refNo: '#CON-2026-001',
      type: 'conge',
      typeLabel: 'Congé',
      sousType: 'Congé annuel',
      employe: 'Amine Kani',
      matricule: 'EMP-2026-014',
      service: 'Comptabilité',
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
      typeLabel: 'Autorisation',
      sousType: 'Personnelle',
      employe: 'Sara Trabelsi',
      matricule: 'EMP-2026-022',
      service: 'Comptabilité',
      dateCreation: '2026-04-03',
      dateDebut: '2026-04-05',
      heureDepart: '09:00',
      heureRetour: '10:30',
      duree: '01h 30',
      motif: 'Rendez-vous médical',
      statut: 'En attente de validation du supérieur hiérarchique'
    },
    {
      id: 3,
      refNo: '#MAL-2026-003',
      type: 'maladie',
      typeLabel: 'Maladie',
      sousType: 'Maladie simple',
      employe: 'Mohamed Kacem',
      matricule: 'EMP-2026-031',
      service: 'Comptabilité',
      dateCreation: '2026-03-28',
      dateDebut: '2026-03-28',
      dateFin: '2026-04-02',
      duree: '6 jours',
      motif: 'Grippe — certificat médical joint',
      statut: 'En attente de validation RH'
    },
    {
      id: 4,
      refNo: '#CON-2026-002',
      type: 'conge',
      typeLabel: 'Congé',
      sousType: 'Congé exceptionnel',
      employe: 'Nadia Bouhajeb',
      matricule: 'EMP-2026-019',
      service: 'Comptabilité',
      dateCreation: '2026-03-30',
      dateDebut: '2026-04-10',
      dateFin: '2026-04-11',
      duree: '2 jours',
      motif: 'Mariage dans la famille',
      statut: 'En attente de validation N+1'
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

  get pendingCount(): number {
    return this.demandes.filter(d =>
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
    this.showApproveModal = true;
    this.showRejectModal = false;
  }

  openRejectModal(): void {
    this.showRejectModal = true;
    this.showApproveModal = false;
    this.rejectMotif = '';
  }

  closeModals(): void {
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.rejectMotif = '';
  }

  approuveDemande(): void {
    if (!this.selectedDemande) return;
    this.actionLoading = true;

    // Simuler un appel API
    setTimeout(() => {
      if (!this.selectedDemande) return;
      const d = this.demandes.find(x => x.id === this.selectedDemande!.id);
      if (d) {
        if (d.type === 'conge') {
          d.statut = 'En attente de validation DG';
        } else if (d.type === 'autorisation') {
          d.statut = 'Validée';
        } else {
          d.statut = 'En attente de validation RH';
        }
      }
      this.actionLoading = false;
      this.showApproveModal = false;
      this.selectedDemande = null;
    }, 600);
  }

  rejeteDemande(): void {
    if (!this.selectedDemande || !this.rejectMotif.trim()) return;
    this.actionLoading = true;

    // Simuler un appel API
    setTimeout(() => {
      if (!this.selectedDemande) return;
      const d = this.demandes.find(x => x.id === this.selectedDemande!.id);
      if (d) {
        d.statut = d.type === 'conge'
          ? 'Rejetée par le supérieur hiérarchique'
          : 'Rejetée';
      }
      this.actionLoading = false;
      this.showRejectModal = false;
      this.selectedDemande = null;
      this.rejectMotif = '';
    }, 600);
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
      conge: 'type-conge',
      autorisation: 'type-auto',
      maladie: 'type-maladie'
    };
    return map[type];
  }
}
