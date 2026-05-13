import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-home-rh',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-rh.html',
  styleUrl: './home-rh.css'
})
export class HomeRh implements OnInit {
  getInitiales(nom: string): string {
    const parts = (nom ?? '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly API  = '';

  kpis = [
    { label: 'Demandes totales', value: '152', tone: 'orange' },
    { label: 'En attente',       value: '18',  tone: 'green'  },
    { label: 'Clôturées',        value: '96',  tone: 'gray'   },
    { label: 'Rejets',           value: '12',  tone: 'red'    }
  ];

  recentItems = [
    { employe: 'Ahmed Ben Ali',  type: 'Congé annuel',     date: '08/03/2026', statut: 'En attente' },
    { employe: 'Sarra Trabelsi', type: 'Autorisation pro', date: '07/03/2026', statut: 'Validée'    },
    { employe: 'Moez Hamdi',     type: 'Congé maladie',    date: '06/03/2026', statut: 'Rejetée'    }
  ];

  alerts = [
    '3 demandes dépassent le délai de traitement habituel.',
    '1 dossier nécessite vérification de pièce justificative.',
    'Le reporting mensuel RH est disponible.'
  ];

  demandesEnAttente: any[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes(): void {
    this.loading = true;
    this.http.get<any[]>(
      `${this.API}/api/demandes-conge?statut=Valid%C3%A9e%20%E2%80%93%20En%20traitement%20RH`
    ).subscribe({
      next:  (data) => { this.demandesEnAttente = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  cloturerConge(id: number): void {
    this.http.post(`${this.API}/api/demandes-conge/${id}/cloturer`, {
      auteurMatricule: this.auth.session?.matricule ?? '',
      commentaire:     ''
    }).subscribe({
      next:  () => this.loadDemandes(),
      error: () => {}
    });
  }
}
