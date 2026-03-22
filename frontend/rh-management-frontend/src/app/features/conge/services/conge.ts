import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** Même URL que le profil http du backend (launchSettings). */
const API_BASE_URL = 'http://localhost:5130';

export interface DemandeCongePayload {
  nomComplet: string;
  matricule: string;
  gradeFonction?: string | null;
  typeConge: string;
  dateDebut: string;
  dateFin: string;
  dureeJours: number;
  motif?: string | null;
  adressePendantConge?: string | null;
  telephone?: string | null;
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
}
