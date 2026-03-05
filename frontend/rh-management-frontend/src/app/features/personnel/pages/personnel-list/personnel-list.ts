import { Component } from '@angular/core';

@Component({
  selector: 'app-personnel-list',
  templateUrl: './personnel-list.html',
  styleUrls: ['./personnel-list.css'],
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
      solde: 12,
    },
    {
      matricule: '002',
      nom: 'Ben',
      prenom: 'Ali',
      direction: 'RH',
      service: 'Administration',
      fonction: 'RH',
      role: 'RH',
      solde: 25,
    },
  ];

  newEmployee = {
    matricule: '',
    nom: '',
    prenom: '',
    direction: 'IT',
    service: '',
    fonction: '',
    role: 'Employé',
    solde: 0,
  };

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  resetForm() {
    this.newEmployee = {
      matricule: '',
      nom: '',
      prenom: '',
      direction: 'IT',
      service: '',
      fonction: '',
      role: 'Employé',
      solde: 0,
    };
  }

  addEmployee() {
    // petite validation
    if (!this.newEmployee.matricule || !this.newEmployee.nom || !this.newEmployee.prenom) return;

    this.employees.push({ ...this.newEmployee, solde: Number(this.newEmployee.solde) });
    this.closeModal();
    this.resetForm();
  }
}