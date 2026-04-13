import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/auth.service';
import { SignaturePad, LeaveRequestSummary, SignatureResult } from '../../../../shared/components/signature-pad/signature-pad';

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
  imports: [CommonModule, FormsModule, RouterLink, SignaturePad],
  templateUrl: './responsable-validations.html',
  styleUrls: ['./responsable-validations.css']
})
export class ResponsableValidations implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly API  = 'http://localhost:5130';

  get responsable() {
    return {
      nomComplet:  this.auth.session?.nomComplet ?? '',
      matricule:   this.auth.session?.matricule  ?? '',
      initiales:   this.auth.session?.initiales  ?? '',
      service:     this.auth.session?.service    ?? '',
      equipeCount: 0
    };
  }

  activeTab: TypeDemande | 'all' = 'all';
  selectedDemande: Demande | null = null;
  showRejectModal  = false;
  showApproveModal = false;
  showSignaturePad = false;
  rejectMotif      = '';
  actionLoading    = false;
  filterStatut     = '';
  signatureRequest: LeaveRequestSummary | null = null;

  demandes: any[] = [];

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes(): void {
    this.http.get<any[]>(
      `${this.API}/api/demandes-conge?statut=En%20attente%20de%20validation%20N%2B1`
    ).subscribe({
      next: (data) => {
        this.demandes = data.map(d => ({
          id:           d.id,
          refNo:        `#CON-${d.id}`,
          type:         'conge',
          typeLabel:    'Congé',
          sousType:     d.typeConge,
          employe:      d.nomComplet,
          matricule:    d.matricule,
          service:      d.service,
          dateCreation: d.createdAt?.substring(0, 10),
          dateDebut:    d.dateDebut,
          dateFin:      d.dateFin,
          duree:        `${d.dureeJours} jours`,
          motif:        d.motif ?? '',
          statut:       d.statut
        }));
      },
      error: () => {}
    });
  }

  get filteredDemandes(): Demande[] {
    return this.demandes.filter((d: any) => {
      const matchTab    = this.activeTab === 'all' || d.type === this.activeTab;
      const matchStatut = !this.filterStatut || d.statut === this.filterStatut;
      return matchTab && matchStatut;
    });
  }

  countByType(type: TypeDemande): number {
    return this.demandes.filter((d: any) => d.type === type).length;
  }

  get pendingCount(): number {
    return this.demandes.filter((d: any) =>
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
    if (!this.selectedDemande) return;
    if (this.selectedDemande.type === 'conge') {
      this.signatureRequest = {
        refNo:       this.selectedDemande.refNo,
        employeeNom: this.selectedDemande.employe,
        type:        this.selectedDemande.sousType,
        dateDebut:   this.selectedDemande.dateDebut,
        dateFin:     this.selectedDemande.dateFin ?? '—',
        motif:       this.selectedDemande.motif
      };
      this.showSignaturePad = true;
      this.showApproveModal = false;
    } else {
      this.showApproveModal = true;
      this.showSignaturePad = false;
    }
    this.showRejectModal = false;
  }

  onSigned(_result: SignatureResult): void {
    this.showSignaturePad = false;
    this.signatureRequest = null;
    this.approuveDemande();
  }

  onSignatureRejected(): void {
    this.showSignaturePad = false;
    this.signatureRequest = null;
    this.openRejectModal();
  }

  onSignatureCancelled(): void {
    this.showSignaturePad = false;
    this.signatureRequest = null;
  }

  openRejectModal(): void {
    this.showRejectModal = true;
    this.showApproveModal = false;
    this.rejectMotif = '';
  }

  closeModals(): void {
    this.showApproveModal = false;
    this.showRejectModal  = false;
    this.showSignaturePad = false;
    this.signatureRequest = null;
    this.rejectMotif      = '';
  }

  approuveDemande(): void {
    if (!this.selectedDemande) return;
    const id = this.selectedDemande.id;
    this.actionLoading = true;
    this.http.post(`${this.API}/api/demandes-conge/${id}/valider-n1`, {
      auteurMatricule: this.auth.session?.matricule ?? '',
      commentaire: ''
    }).subscribe({
      next: () => {
        this.actionLoading    = false;
        this.showApproveModal = false;
        this.selectedDemande  = null;
        this.loadDemandes();
      },
      error: () => { this.actionLoading = false; }
    });
  }

  rejeteDemande(): void {
    if (!this.selectedDemande || !this.rejectMotif.trim()) return;
    const id = this.selectedDemande.id;
    this.actionLoading = true;
    this.http.post(`${this.API}/api/demandes-conge/${id}/rejeter-n1`, {
      auteurMatricule: this.auth.session?.matricule ?? '',
      commentaire: this.rejectMotif
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
      conge:        'type-conge',
      autorisation: 'type-auto',
      maladie:      'type-maladie'
    };
    return map[type];
  }
}
