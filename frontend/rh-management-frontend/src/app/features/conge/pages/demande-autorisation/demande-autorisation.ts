import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

type AutorisationType = 'personnel' | 'professionnel' | 'formation';

@Component({
  selector: 'app-demande-autorisation',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterLink],
  templateUrl: './demande-autorisation.html',
  styleUrls: ['./demande-autorisation.css']
})
export class DemandeAutorisation {
  selectedType: AutorisationType = 'personnel';
  showConfirm = false;

  demande = {
    nomEmploye: '',
    matricule: '',
    direction: '',
    date: '',
    motif: '',
    duree: '',
    heureDepart: '',
    minuteDepart: '',
    heureRetour: '',
    minuteRetour: '',
    remarqueRh: ''
  };

  get selectedTypeLabel(): string {
    switch (this.selectedType) {
      case 'personnel':
        return 'Personnel';
      case 'professionnel':
        return 'Professionnel';
      case 'formation':
        return 'Formation';
      default:
        return '';
    }
  }

  selectType(type: AutorisationType) {
    this.selectedType = type;
  }

  openConfirm() {
    this.showConfirm = true;
  }

  closeConfirm() {
    this.showConfirm = false;
  }

  submitDemande() {
    console.log('Demande d’autorisation envoyée :', {
      type: this.selectedType,
      ...this.demande
    });
    this.showConfirm = false;
  }
}