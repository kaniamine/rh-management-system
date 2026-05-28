import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-mon-profil',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mon-profil.html',
  styleUrl: './mon-profil.css'
})
export class MonProfil implements OnInit {
  private readonly auth       = inject(AuthService);
  private readonly http       = inject(HttpClient);
  private readonly cdr        = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);

  totalDemandes    = 0;
  demandesValidees = 0;
  demandesRejetees = 0;
  demandesAttente  = 0;
  statsLoading     = true;

  get session() { return this.auth.session; }
  get isRh(): boolean { return this.auth.role === 'rh'; }
  get isAdmin(): boolean {
    return isPlatformBrowser(this.platformId) && localStorage.getItem('isAdmin') === 'true';
  }

  get roleLabel(): string {
    const map: Record<string, string> = {
      employe: 'Employé',
      n1:      'Responsable N+1',
      dg:      'Direction Générale',
      rh:      'Direction RH',
      admin:   'Direction RH'
    };
    return map[this.auth.role] ?? this.auth.role;
  }

  get initiales(): string {
    const nom = this.session?.nomComplet ?? '';
    const parts = nom.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  get soldeBarWidth(): string {
    const solde = this.session?.soldeConges ?? 0;
    const pct = Math.min(100, Math.round((solde / 30) * 100));
    return `${pct}%`;
  }

  get soldeBarColor(): string {
    const solde = this.session?.soldeConges ?? 0;
    if (solde <= 5)  return '#c60c30';
    if (solde <= 10) return '#f0a500';
    return '#0D776E';
  }

  ngOnInit(): void {
    const matricule = this.session?.matricule;
    if (!matricule) { this.statsLoading = false; return; }

    forkJoin({
      conges:        this.http.get<any[]>(`/api/demandes-conge?matricule=${matricule}`).pipe(catchError(() => of([]))),
      autorisations: this.http.get<any[]>(`/api/demandes-autorisation?matricule=${matricule}`).pipe(catchError(() => of([]))),
      maladies:      this.http.get<any[]>(`/api/demandes-maladie?matricule=${matricule}`).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ conges, autorisations, maladies }) => {
        const all = [...conges, ...autorisations, ...maladies];
        this.totalDemandes    = all.length;
        this.demandesValidees = all.filter(d =>
          d.statut === 'Clôturée' || (d.statut ?? '').startsWith('Validée')
        ).length;
        this.demandesRejetees = all.filter(d =>
          (d.statut ?? '').startsWith('Rejetée') || d.statut === 'Annulée'
        ).length;
        this.demandesAttente  = all.filter(d =>
          (d.statut ?? '').startsWith('En attente')
        ).length;
        this.statsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.statsLoading = false; this.cdr.detectChanges(); }
    });
  }
}
