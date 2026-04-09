import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dg-validations.html',
  styleUrls: ['./dg-validations.css']
})
export class DgValidations {
  filterStatut = '';
  filterEmploye = '';
  selectedDemande: DemandeConge | null = null;
  showApproveModal = false;
  showRejectModal = false;
  rejectMotif = '';
  approveComment = '';
  actionLoading = false;

  readonly dg = {
    nom: 'Directeur Général',
    initiales: 'DG'
  };

  demandes: DemandeConge[] = [
    {
      id: 101,
      refNo: '#CON-2026-011',
      sousType: 'Congé annuel',
      employe: 'Amine Kani',
      matricule: 'EMP-2026-014',
      direction: 'Direction Finance',
      service: 'Comptabilité',
      superieurN1: 'Ahmed Ben Ali',
      dateCreation: '2026-03-25',
      dateDebut: '2026-04-15',
      dateFin: '2026-04-20',
      duree: '5 jours',
      motif: 'Voyage familial',
      adresse: '12 Rue Habib Bourguiba, Tunis',
      telephone: '+216 98 765 432',
      statut: 'En attente de validation DG',
      validationN1: {
        par: 'Ahmed Ben Ali',
        le: '2026-03-26',
        commentaire: 'Demande approuvée, aucun projet critique pendant cette période.'
      }
    },
    {
      id: 102,
      refNo: '#CON-2026-012',
      sousType: 'Congé exceptionnel de courte durée',
      employe: 'Nadia Bouhajeb',
      matricule: 'EMP-2026-019',
      direction: 'Direction Commerciale',
      service: 'Vente directe',
      superieurN1: 'Sami Farhat',
      dateCreation: '2026-03-28',
      dateDebut: '2026-04-08',
      dateFin: '2026-04-09',
      duree: '2 jours',
      motif: 'Mariage dans la famille proche',
      statut: 'En attente de validation DG',
      validationN1: {
        par: 'Sami Farhat',
        le: '2026-03-29',
        commentaire: 'Validé — motif personnel légitime.'
      }
    },
    {
      id: 103,
      refNo: '#CON-2026-009',
      sousType: 'Congé annuel',
      employe: 'Riadh Mejri',
      matricule: 'EMP-2026-008',
      direction: 'Direction Technique',
      service: 'Informatique',
      superieurN1: 'Leila Souissi',
      dateCreation: '2026-03-20',
      dateDebut: '2026-04-01',
      dateFin: '2026-04-10',
      duree: '8 jours',
      motif: 'Repos annuel',
      adresse: 'Famille à Sfax',
      statut: 'Validée – En traitement RH',
      validationN1: {
        par: 'Leila Souissi',
        le: '2026-03-21'
      }
    },
    {
      id: 104,
      refNo: '#CON-2026-010',
      sousType: 'Congé annuel',
      employe: 'Mariem Chaabani',
      matricule: 'EMP-2026-035',
      direction: 'Direction Finance',
      service: 'Audit interne',
      superieurN1: 'Ahmed Ben Ali',
      dateCreation: '2026-03-22',
      dateDebut: '2026-04-22',
      dateFin: '2026-04-26',
      duree: '5 jours',
      motif: 'Congé annuel planifié',
      statut: 'Rejetée par la Direction Générale',
      validationN1: {
        par: 'Ahmed Ben Ali',
        le: '2026-03-23',
        commentaire: 'Approuvé N+1'
      }
    }
  ];

  get filteredDemandes(): DemandeConge[] {
    const q = this.filterEmploye.toLowerCase();
    return this.demandes.filter(d => {
      const matchStatut = !this.filterStatut || d.statut === this.filterStatut;
      const matchEmploye = !q || d.employe.toLowerCase().includes(q) || d.matricule.toLowerCase().includes(q);
      return matchStatut && matchEmploye;
    });
  }

  get pendingCount(): number {
    return this.demandes.filter(d => d.statut === 'En attente de validation DG').length;
  }

  get validatedCount(): number {
    return this.demandes.filter(d =>
      d.statut === 'Validée – En traitement RH' || d.statut === 'Clôturée'
    ).length;
  }

  get rejectedCount(): number {
    return this.demandes.filter(d => d.statut === 'Rejetée par la Direction Générale').length;
  }

  isPending(d: DemandeConge): boolean {
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
    this.showRejectModal = false;
    this.rejectMotif = '';
    this.approveComment = '';
  }

  closeDetail(): void {
    this.selectedDemande = null;
    this.showApproveModal = false;
    this.showRejectModal = false;
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
    this.approveComment = '';
  }

  approuver(): void {
    if (!this.selectedDemande) return;
    this.actionLoading = true;
    setTimeout(() => {
      const d = this.demandes.find(x => x.id === this.selectedDemande!.id);
      if (d) d.statut = 'Validée – En traitement RH';
      this.actionLoading = false;
      this.showApproveModal = false;
      this.selectedDemande = null;
    }, 600);
  }

  rejeter(): void {
    if (!this.selectedDemande || !this.rejectMotif.trim()) return;
    this.actionLoading = true;
    setTimeout(() => {
      const d = this.demandes.find(x => x.id === this.selectedDemande!.id);
      if (d) d.statut = 'Rejetée par la Direction Générale';
      this.actionLoading = false;
      this.showRejectModal = false;
      this.selectedDemande = null;
      this.rejectMotif = '';
    }, 600);
  }
}
