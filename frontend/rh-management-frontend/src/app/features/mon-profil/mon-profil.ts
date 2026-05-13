import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-mon-profil',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mon-profil.html',
  styleUrl: './mon-profil.css'
})
export class MonProfil implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);

  totalDemandes   = 0;
  demandesValidees = 0;
  demandesRejetees = 0;
  statsLoaded      = false;

  get session() { return this.auth.session; }

  get roleLabel(): string {
    const map: Record<string, string> = {
      employe: 'Employé',
      n1:      'Responsable N+1',
      dg:      'Direction Générale',
      rh:      'Direction RH',
      admin:   'Administrateur'
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
    if (!matricule) return;

    this.http.get<any[]>(`/api/demandes-conge?matricule=${matricule}`).subscribe({
      next: (demandes) => {
        this.totalDemandes    = demandes.length;
        this.demandesValidees = demandes.filter(d =>
          d.statut === 'Clôturée' || (d.statut ?? '').startsWith('Validée')
        ).length;
        this.demandesRejetees = demandes.filter(d =>
          (d.statut ?? '').startsWith('Rejetée') || d.statut === 'Annulée'
        ).length;
        this.statsLoaded = true;
      },
      error: () => { this.statsLoaded = true; }
    });
  }
}
