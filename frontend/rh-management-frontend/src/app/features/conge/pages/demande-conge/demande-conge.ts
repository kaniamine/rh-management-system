import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-demande-conge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-conge.html',
  styleUrls: ['./demande-conge.css']
})
export class DemandeConge {
  showConfirm = false;

  envoyerDemande() {
    console.log('Demande envoyée');
    this.showConfirm = false;
  }
}