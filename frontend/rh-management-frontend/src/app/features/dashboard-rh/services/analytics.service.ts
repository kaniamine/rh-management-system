import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MoisStat      { mois: string; count: number; }
export interface TypeStat      { type: string; count: number; }
export interface StatutStat    { statut: string; count: number; }
export interface DirectionStat { direction: string; count: number; }
export interface TopEmployeStat {
  matricule:  string;
  nomComplet: string;
  count:      number;
}

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
  topEmployes?:          TopEmployeStat[];
  anneeFiltre?:          number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private API  = '/api/analytics';

  getRhDashboard(year?: number): Observable<RhAnalytics> {
    const params = year ? `?year=${year}` : '';
    return this.http.get<RhAnalytics>(`${this.API}/rh-dashboard${params}`);
  }

  getAvailableYears(): Observable<number[]> {
    return this.http.get<number[]>(`${this.API}/available-years`);
  }
}
