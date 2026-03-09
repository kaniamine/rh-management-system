import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-rh',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-rh.html',
  styleUrl: './home-rh.css'
})
export class HomeRh {
  kpis = [
    { label: 'Demandes totales', value: '152', tone: 'orange' },
    { label: 'En attente', value: '18', tone: 'green' },
    { label: 'Clôturées', value: '96', tone: 'gray' },
    { label: 'Rejets', value: '12', tone: 'red' }
  ];

  recentItems = [
    { employe: 'Ahmed Ben Ali', type: 'Congé annuel', date: '08/03/2026', statut: 'En attente' },
    { employe: 'Sarra Trabelsi', type: 'Autorisation pro', date: '07/03/2026', statut: 'Validée' },
    { employe: 'Moez Hamdi', type: 'Congé maladie', date: '06/03/2026', statut: 'Rejetée' }
  ];

  alerts = [
    '3 demandes dépassent le délai de traitement habituel.',
    '1 dossier nécessite vérification de pièce justificative.',
    'Le reporting mensuel RH est disponible.'
  ];
}