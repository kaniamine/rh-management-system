import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home-employee',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-employee.html',
  styleUrl: './home-employee.css'
})
export class HomeEmployee implements OnInit {
  private readonly http = inject(HttpClient);

  // Matricule de l'employé connecté — à remplacer par AuthService en prod
  private readonly matricule = 'EMP-2026-014';

  employee = {
    nom: '',
    matricule: this.matricule,
    poste: '',
    service: ''
  };

  stats = [
    { label: 'Solde de congés', value: '-- j', tone: 'orange' },
    { label: 'Demandes en attente', value: '--', tone: 'green' },
    { label: 'Autorisations ce mois', value: '--', tone: 'gray' }
  ];

  recentRequests: { type: string; date: string; statut: string }[] = [];

  notifications: string[] = [];

  ngOnInit(): void {
    this.loadEmploye();
    this.loadDemandes();
  }

  private loadEmploye(): void {
    this.http
      .get<any>(`/api/employes/${this.matricule}`)
      .subscribe({
        next: (emp) => {
          this.employee.nom = emp.nomComplet ?? `${emp.prenom ?? ''} ${emp.nom ?? ''}`.trim();
          this.employee.poste = emp.fonction ?? '';
          this.employee.service = emp.service ?? '';

          // Mettre à jour le solde de congés
          const solde = emp.soldeConges ?? emp.soldeCongesJours ?? 0;
          this.stats[0].value = `${solde} j`;
        },
        error: () => {
          // Fallback si API indisponible
          this.stats[0].value = '-- j';
        }
      });
  }

  private loadDemandes(): void {
    this.http
      .get<any[]>(`/api/demandes-conge?matricule=${this.matricule}`)
      .subscribe({
        next: (demandes) => {
          // Compter les demandes en attente
          const enAttente = demandes.filter(d =>
            d.statut?.startsWith('En attente')
          ).length;
          this.stats[1].value = `${enAttente}`;

          // Compter les autorisations ce mois
          const moisCourant = new Date().getMonth();
          const autorisationsMois = demandes.filter(d => {
            const date = new Date(d.createdAt ?? d.dateCreation ?? '');
            return date.getMonth() === moisCourant &&
              (d.typeConge ?? '').toLowerCase().includes('autorisation');
          }).length;
          this.stats[2].value = `${autorisationsMois}`;

          // 5 demandes récentes
          this.recentRequests = demandes.slice(0, 5).map(d => ({
            type: d.typeConge ?? d.sousType ?? 'Demande',
            date: this.formatDate(d.createdAt ?? d.dateCreation),
            statut: this.mapStatut(d.statut)
          }));

          // Notifications dynamiques basées sur les demandes
          this.notifications = demandes
            .filter(d => d.statut && d.statut !== 'Brouillon')
            .slice(0, 3)
            .map(d => this.buildNotification(d));
        },
        error: () => {
          this.recentRequests = [];
          this.notifications = ['Impossible de charger vos notifications.'];
        }
      });
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR');
  }

  private mapStatut(statut: string): string {
    if (!statut) return 'Inconnu';
    if (statut.startsWith('En attente')) return 'En attente';
    if (statut === 'Clôturée' || statut.startsWith('Validée')) return 'Validée';
    if (statut.startsWith('Rejetée') || statut === 'Annulée') return 'Rejetée';
    return statut;
  }

  private buildNotification(d: any): string {
    const ref = d.refNo ?? `#${d.id}`;
    const type = d.typeConge ?? 'Demande';
    if (d.statut === 'Clôturée')
      return `Votre demande ${ref} (${type}) a été clôturée. Votre solde a été mis à jour.`;
    if (d.statut?.startsWith('Validée'))
      return `Votre demande ${ref} (${type}) a été validée et est en traitement RH.`;
    if (d.statut?.startsWith('Rejetée'))
      return `Votre demande ${ref} (${type}) a été rejetée.`;
    if (d.statut?.startsWith('En attente'))
      return `Votre demande ${ref} (${type}) est en attente de validation.`;
    return `Statut de votre demande ${ref} : ${d.statut}`;
  }
}