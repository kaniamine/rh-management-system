import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
  private readonly API  = 'http://localhost:5130';

  filterStatut  = '';
  filterEmploye = '';
  selectedDemande: DemandeConge | null = null;
  showApproveModal = false;
  showRejectModal  = false;
  rejectMotif      = '';
  approveComment   = '';
  actionLoading    = false;

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

  loadDemandes(): void {
    this.http.get<any[]>(
      `${this.API}/api/demandes-conge?statut=En%20attente%20de%20validation%20DG`
    ).subscribe({
      next: (data) => { this.demandes = data; },
      error: () => {}
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
        this.loadDemandes();
      },
      error: () => { this.actionLoading = false; }
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
        this.loadDemandes();
      },
      error: () => { this.actionLoading = false; }
    });
  }
}
