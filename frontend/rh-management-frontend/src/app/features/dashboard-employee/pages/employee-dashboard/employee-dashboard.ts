import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/auth.service';

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

const API = 'http://localhost:5130/api';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css'
})
export class EmployeeDashboard implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  activeTab: TypeDemande = 'all';
  filterStatut = '';
  selectedDemande: Demande | null = null;
  loadError: string | null = null;

  readonly stats = {
    soldeConges: 12,
    enAttente: 3,
    validees: 8,
    rejetees: 1
  };

  demandes: Demande[] = [];

  ngOnInit(): void {
    this.chargerDemandes();
  }

  private chargerDemandes(): void {
    const matricule = this.auth.session?.matricule ?? '';
    this.http
      .get<any[]>(`${API}/demandes-conge?matricule=${encodeURIComponent(matricule)}`)
      .subscribe({
        next: (data) => {
          this.demandes = data.map(c => ({
            id:           c.id,
            refNo:        c.refNo ?? `#CON-${c.id}`,
            type:         'conge' as TypeDemande,
            sousType:     c.typeConge ?? '',
            dateCreation: c.createdAt?.substring(0, 10) ?? '',
            dateDebut:    c.dateDebut ?? '',
            dateFin:      c.dateFin ?? undefined,
            duree:        c.typeDuree ?? '',
            motif:        c.motif ?? '',
            statut:       c.statut ?? ''
          }));
        },
        error: (err: HttpErrorResponse) => {
          this.loadError = err.error?.message ?? `Erreur ${err.status} lors du chargement.`;
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
