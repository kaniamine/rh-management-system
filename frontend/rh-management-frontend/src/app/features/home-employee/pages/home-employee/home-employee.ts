import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-home-employee',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-employee.html',
  styleUrl: './home-employee.css'
})
export class HomeEmployee {
  private readonly auth = inject(AuthService);

  get employee() {
    return {
      nom:       this.auth.session?.nomComplet ?? '',
      matricule: this.auth.session?.matricule  ?? '',
      poste:     this.auth.session?.fonction   ?? '',
      service:   this.auth.session?.service    ?? '',
      direction: this.auth.session?.direction  ?? ''
    };
  }

  stats = [
    { label: 'Solde de congés', value: '12 j', tone: 'orange' },
    { label: 'Demandes en attente', value: '2', tone: 'green' },
    { label: 'Autorisations ce mois', value: '3', tone: 'gray' }
  ];

  recentRequests = [
    { type: 'Congé annuel', date: '08/03/2026', statut: 'En attente' },
    { type: 'Autorisation personnelle', date: '06/03/2026', statut: 'Validée' },
    { type: 'Congé maladie', date: '03/03/2026', statut: 'Rejetée' }
  ];

  notifications = [
    'Votre demande de congé a été transmise au supérieur hiérarchique.',
    'Votre autorisation personnelle du 06/03/2026 a été validée.',
    'Pensez à compléter votre profil employé.'
  ];
}