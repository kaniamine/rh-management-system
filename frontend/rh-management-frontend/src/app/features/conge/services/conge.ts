import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:5130';

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
