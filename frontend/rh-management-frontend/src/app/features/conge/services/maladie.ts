import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:5130';

export interface DemandeMaladieResponse {
  id: number;
  statut: string;
}

@Injectable({
  providedIn: 'root',
})
export class Maladie {
  private readonly http = inject(HttpClient);

  creerDemande(formData: FormData): Observable<DemandeMaladieResponse> {
    return this.http.post<DemandeMaladieResponse>(
      `${API_BASE_URL}/api/demandes-maladie`,
      formData
    );
  }

  getDemandes(matricule?: string, statut?: string): Observable<any[]> {
    let params = '';
    if (matricule) params += `?matricule=${encodeURIComponent(matricule)}`;
    if (statut) params += `${params ? '&' : '?'}statut=${encodeURIComponent(statut)}`;
    return this.http.get<any[]>(`${API_BASE_URL}/api/demandes-maladie${params}`);
  }

  valider(id: number, auteurMatricule: string, commentaire: string = ''): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/demandes-maladie/${id}/valider`,
      { auteurMatricule, commentaire });
  }

  rejeter(id: number, auteurMatricule: string, commentaire: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/demandes-maladie/${id}/rejeter`,
      { auteurMatricule, commentaire });
  }

  annuler(id: number, auteurMatricule: string, commentaire: string = ''): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/demandes-maladie/${id}/annuler`,
      { auteurMatricule, commentaire });
  }
}
