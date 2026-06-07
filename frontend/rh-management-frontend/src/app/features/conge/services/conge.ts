import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

const API_BASE_URL = '';

export interface DemandeCongePayload {
  typeConge: string;
  typeDuree: string;
  dateDebut: string;
  dateFin: string;
  estBrouillon: boolean;
  statut?: string | null;
  nomComplet: string;
  matricule: string;
  service?: string | null;
  superieurHierarchique?: string | null;
  motif?: string | null;
  adressePendantConge?: string | null;
  telephone?: string | null;
  pieceJustificativeFichierNom?: string | null;
}

export interface DemandeCongeResponse {
  id: number;
  statut: string;
}

@Injectable({
  providedIn: 'root',
})
export class Conge {
  private readonly http = inject(HttpClient);

  creerDemande(payload: DemandeCongePayload): Observable<DemandeCongeResponse> {
    return this.http.post<DemandeCongeResponse>(
      `${API_BASE_URL}/api/demandes-conge`,
      payload
    );
  }

  getDemandes(matricule?: string, statut?: string): Observable<any[]> {
    let params = '';
    if (matricule) params += `?matricule=${matricule}`;
    if (statut) params += `${params ? '&' : '?'}statut=${encodeURIComponent(statut)}`;
    return this.http.get<any[]>(`${API_BASE_URL}/api/demandes-conge${params}`);
  }

  validerN1(id: number, auteurMatricule: string, commentaire: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/demandes-conge/${id}/valider-n1`,
      { auteurMatricule, commentaire });
  }

  rejeterN1(id: number, auteurMatricule: string, commentaire: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/demandes-conge/${id}/rejeter-n1`,
      { auteurMatricule, commentaire });
  }

  validerDG(id: number, auteurMatricule: string, commentaire: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/demandes-conge/${id}/valider-dg`,
      { auteurMatricule, commentaire });
  }

  rejeterDG(id: number, auteurMatricule: string, commentaire: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/demandes-conge/${id}/rejeter-dg`,
      { auteurMatricule, commentaire });
  }

  cloturer(id: number, auteurMatricule: string, commentaire: string = ''): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/demandes-conge/${id}/cloturer`,
      { auteurMatricule, commentaire });
  }

  annuler(id: number, auteurMatricule: string, commentaire: string = ''): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/demandes-conge/${id}/annuler`,
      { auteurMatricule, commentaire });
  }
}
