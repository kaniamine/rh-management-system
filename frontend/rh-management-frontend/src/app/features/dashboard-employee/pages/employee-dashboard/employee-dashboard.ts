import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

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
  private readonly http = inject(HttpClient);

  loading = true;
  activeTab: TypeDemande = 'all';
  filterStatut = '';
  selectedDemande: Demande | null = null;
  loadError: string | null = null;

  stats = {
    soldeConges: 12,
    enAttente: 3,
    validees: 8,
    rejetees: 1
  };

  demandes: Demande[] = [];

  ngOnInit(): void {
    forkJoin({
      conges:        this.http.get<any[]>('http://localhost:5130/api/demandes-conge'),
      autorisations: this.http.get<any[]>('http://localhost:5130/api/autorisations-sortie'),
      maladies:      this.http.get<any[]>('http://localhost:5130/api/demandes-maladie')
    }).subscribe({
      next: ({ conges, autorisations, maladies }) => {
        const mapped: Demande[] = [
          ...conges
            .filter(d => d.matricule === 'EMP-2026-014')
            .map(d => ({
              id:           d.id,
              refNo:        `#CON-${d.id}`,
              type:         'conge' as TypeDemande,
              sousType:     d.typeConge,
              dateDebut:    d.dateDebut,
              dateFin:      d.dateFin,
              duree:        d.dureeJours + ' jour(s)',
              statut:       d.statut,
              motif:        d.motif ?? '',
              dateCreation: d.createdAt?.substring(0, 10) ?? ''
            })),
          ...autorisations
            .filter(d => d.matricule === 'EMP-2026-014')
            .map(d => ({
              id:           d.id,
              refNo:        `#AUT-${d.id}`,
              type:         'autorisation' as TypeDemande,
              sousType:     d.typeAutorisation,
              dateDebut:    d.dateDemande,
              duree:        d.duree ?? '',
              statut:       d.statut,
              motif:        d.motif ?? '',
              dateCreation: d.createdAt?.substring(0, 10) ?? ''
            })),
          ...maladies
            .filter(d => d.matricule === 'EMP-2026-014')
            .map(d => ({
              id:           d.id,
              refNo:        `#MAL-${d.id}`,
              type:         'maladie' as TypeDemande,
              sousType:     d.typeMaladie,
              dateDebut:    d.dateDebut,
              dateFin:      d.dateFin,
              duree:        d.nombreJours + ' jour(s)',
              statut:       d.statut,
              motif:        d.commentaire ?? '',
              dateCreation: d.createdAt?.substring(0, 10) ?? ''
            }))
        ];

        this.demandes = mapped.sort((a, b) => b.dateCreation.localeCompare(a.dateCreation));

        this.stats.enAttente = this.demandes.filter(d => d.statut.startsWith('En attente')).length;
        this.stats.validees  = this.demandes.filter(d => d.statut === 'Validée' || d.statut.includes('traitement')).length;
        this.stats.rejetees  = this.demandes.filter(d => d.statut.startsWith('Rejetée')).length;

        this.loading = false;
      },
      error: () => {
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
      d.statut === 'En attente de validation N+1' ||
      d.statut === 'En attente de validation du supérieur hiérarchique' ||
      d.statut === 'Brouillon'
    );
  }
}
