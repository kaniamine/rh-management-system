import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-personnel-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personnel-list.html',
  styleUrls: ['./personnel-list.css']
})
export class PersonnelList {
  isModalOpen = false;

  employees = [
    {
      matricule: '001',
      nom: 'Kani',
      prenom: 'Amine',
      direction: 'IT',
      service: 'Développement',
      fonction: 'Développeur',
      role: 'Employé',
      solde: 12
    },
    {
      matricule: '002',
      nom: 'Ben',
      prenom: 'Ali',
      direction: 'RH',
      service: 'Administration',
      fonction: 'RH',
      role: 'RH',
      solde: 25
    }
  ];

  newEmployee = {
    matricule: '',
    nom: '',
    prenom: '',
    direction: 'IT',
    service: '',
    fonction: '',
    role: 'Employé',
    solde: 0
  };

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  addEmployee() {
    console.log('addEmployee called');
    console.log(this.newEmployee);

    if (
      !this.newEmployee.matricule ||
      !this.newEmployee.nom ||
      !this.newEmployee.prenom
    ) {
      alert('Remplis les champs obligatoires');
      return;
    }

    this.employees.push({
      ...this.newEmployee,
      solde: Number(this.newEmployee.solde)
    });

    this.newEmployee = {
      matricule: '',
      nom: '',
      prenom: '',
      direction: 'IT',
      service: '',
      fonction: '',
      role: 'Employé',
      solde: 0
    };

    this.closeModal();
  }
}