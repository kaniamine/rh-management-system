import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

const API_BASE_URL = '';

export interface DemandeAutorisationPayload {
  nomComplet: string;
  matricule: string;
  gradeFonction?: string | null;
  typeAutorisation: string;
  dateDemande: string;
  heureSortie?: string | null;
  heureRetour?: string | null;
  motif?: string | null;
  destination?: string | null;
  telephone?: string | null;
  estBrouillon: boolean;
}

export interface DemandeAutorisationResponse {
  id: number;
  statut: string;
}

@Injectable({
  providedIn: 'root',
})
export class Autorisation {
  private readonly http = inject(HttpClient);

  creerDemande(payload: DemandeAutorisationPayload): Observable<DemandeAutorisationResponse> {
    return this.http.post<DemandeAutorisationResponse>(
      `${API_BASE_URL}/api/DemandeAutorisation`,
      payload
    );
  }
}
