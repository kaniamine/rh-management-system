import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-demande-conge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-conge.html',
  styleUrls: ['./demande-conge.css'],
  encapsulation: ViewEncapsulation.None // ⭐ IMPORTANT pour le CSS global
})
export class DemandeConge {

  // ===============================
  // MODAL STATE
  // ===============================
  showConfirmModal = false;
  currentAction: 'submit' | 'draft' | null = null;

  modalTitle = '';
  modalMessage = '';

  // ===============================
  // OPEN MODAL
  // ===============================
  openConfirmModal(action: 'submit' | 'draft'): void {
    this.currentAction = action;

    if (action === 'submit') {
      this.modalTitle = 'Confirmer la demande';
      this.modalMessage = 'Êtes-vous sûr de vouloir soumettre cette demande de congé ?';
    }

    if (action === 'draft') {
      this.modalTitle = 'Enregistrer en brouillon';
      this.modalMessage = 'Voulez-vous enregistrer cette demande comme brouillon ?';
    }

    this.showConfirmModal = true;
  }

  // ===============================
  // CLOSE MODAL
  // ===============================
  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.currentAction = null;
  }

  // ===============================
  // CONFIRM ACTION
  // ===============================
  confirmAction(): void {

    if (this.currentAction === 'submit') {
      console.log('✅ Demande soumise');
      // 👉 TODO: appeler API submit ici
    }

    if (this.currentAction === 'draft') {
      console.log('💾 Brouillon enregistré');
      // 👉 TODO: appeler API draft ici
    }

    this.closeConfirmModal();
  }

}