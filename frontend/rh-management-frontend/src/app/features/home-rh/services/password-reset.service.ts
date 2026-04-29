import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PasswordResetService {
  private readonly http = inject(HttpClient);
  private readonly API  = 'http://localhost:5130/api/auth';

  getDemandesEnAttente(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/demandes-reinitialisation`);
  }

  reinitialiserMotDePasse(demandeId: number, nouveauMotDePasse: string): Observable<any> {
    return this.http.post(`${this.API}/reinitialiser-mot-de-passe`, {
      demandeId,
      nouveauMotDePasse
    });
  }
}
