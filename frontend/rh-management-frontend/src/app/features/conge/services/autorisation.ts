import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:5130';

export interface DemandeAutorisationPayload {
  nomComplet: string;
  matricule: string;
  direction?: string | null;
  service?: string | null;
  superieurHierarchique?: string | null;
  gradeFonction?: string | null;
  typeAutorisation: string;
  dateDemande: string;
  heureSortie?: string | null;
  heureRetour?: string | null;
  dureeCalculee?: string | null;
  motif?: string | null;
  destination?: string | null;
  telephone?: string | null;
  commentaire?: string | null;
  estBrouillon: boolean;
}

export interface DemandeAutorisationResponse {
  id: number;
  statut: string;
}

export interface CumulMensuelResponse {
  nombreAutorisations: number;
  dureeMinutesCumulee: number;
}

@Injectable({
  providedIn: 'root',
})
export class Autorisation {
  private readonly http = inject(HttpClient);

  creerDemande(payload: DemandeAutorisationPayload): Observable<DemandeAutorisationResponse> {
    return this.http.post<DemandeAutorisationResponse>(
      `${API_BASE_URL}/api/autorisations-sortie`,
      payload
    );
  }

  getDemandes(matricule?: string, statut?: string): Observable<any[]> {
    let params = '';
    if (matricule) params += `?matricule=${encodeURIComponent(matricule)}`;
    if (statut) params += `${params ? '&' : '?'}statut=${encodeURIComponent(statut)}`;
    return this.http.get<any[]>(`${API_BASE_URL}/api/demandes-autorisation${params}`);
  }

  getCumulMensuel(matricule: string, mois: string): Observable<CumulMensuelResponse> {
    return this.http.get<CumulMensuelResponse>(
      `${API_BASE_URL}/api/demandes-autorisation/cumul-mensuel?matricule=${encodeURIComponent(matricule)}&mois=${encodeURIComponent(mois)}`
    );
  }

  validerN1(id: number, auteurMatricule: string, commentaire: string = ''): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/demandes-autorisation/${id}/valider-n1`,
      { auteurMatricule, commentaire });
  }

  rejeterN1(id: number, auteurMatricule: string, commentaire: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/demandes-autorisation/${id}/rejeter-n1`,
      { auteurMatricule, commentaire });
  }

  annuler(id: number, auteurMatricule: string, commentaire: string = ''): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/demandes-autorisation/${id}/annuler`,
      { auteurMatricule, commentaire });
  }
}
