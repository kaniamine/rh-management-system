import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MoisStat      { mois: string; count: number; }
export interface TypeStat      { type: string; count: number; }
export interface StatutStat    { statut: string; count: number; }
export interface DirectionStat { direction: string; count: number; }

export interface RhAnalytics {
  totalDemandes: number;
  totalConges: number;
  totalAutorisations: number;
  totalMaladies: number;
  enAttente: number;
  validees: number;
  rejetees: number;
  cloturees: number;
  tauxValidation: number;
  tauxRejet: number;
  moyenneSoldeConges: number;
  totalJoursMaladie: number;
  totalJoursConge: number;
  tauxValidationConge: number;
  tauxValidationAuto: number;
  tauxValidationMaladie: number;
  totalEmployes: number;
  demandesParMois:       MoisStat[];
  congesValideesParMois: MoisStat[];
  repartitionParType:    TypeStat[];
  repartitionParStatut:  StatutStat[];
  demandesParDirection:  DirectionStat[];
  typeCongeBreakdown:    TypeStat[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private API  = '/api/analytics';

  getRhDashboard(): Observable<RhAnalytics> {
    return this.http.get<RhAnalytics>(`${this.API}/rh-dashboard`);
  }
}
