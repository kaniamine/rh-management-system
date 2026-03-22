import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-demande-conge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-conge.html',
  styleUrls: ['./demande-conge.css'],
  encapsulation: ViewEncapsulation.None
})
export class DemandeConge {
  showConfirmModal = false;
  currentAction: 'submit' | 'draft' | null = null;

  modalTitle = '';
  modalMessage = '';

  openConfirmModal(action: 'submit' | 'draft'): void {
    this.currentAction = action;

    if (action === 'submit') {
      this.modalTitle = 'Confirmer la demande';
      this.modalMessage = 'Êtes-vous sûr de vouloir soumettre cette demande de congé ?';
    } else {
      this.modalTitle = 'Enregistrer en brouillon';
      this.modalMessage = 'Voulez-vous enregistrer cette demande comme brouillon ?';
    }

    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.currentAction = null;
  }

  confirmAction(): void {
    if (this.currentAction === 'submit') {
      console.log('Demande soumise');
    } else if (this.currentAction === 'draft') {
      console.log('Brouillon enregistré');
    }

    this.closeConfirmModal();
  }
}