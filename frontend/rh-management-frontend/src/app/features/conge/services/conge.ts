import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// Avec `ng serve`, le proxy (proxy.conf.json) envoie /api → http://localhost:5130 (même origine, pas de CORS).
// Pour appeler l’API sans proxy, définir l’URL complète, ex. 'http://localhost:5130'.
const API_BASE_URL = '';

export interface DemandeCongePayload {
  typeConge: string;
  typeDuree: string;
  dateDebut: string;
  dateFin: string;
  estBrouillon: boolean;
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
}
