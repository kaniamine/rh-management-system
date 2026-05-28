import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/auth.service';

const API = 'http://localhost:5131';

@Component({
  selector:    'app-personnel-list',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './personnel-list.html',
  styleUrls:   ['./personnel-list.css']
})
export class PersonnelList implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr  = inject(ChangeDetectorRef);

  isLoading     = false;
  actionLoading = false;
  erreur        = '';
  successMsg    = '';

  employees: any[] = [];

  isModalOpen     = false;
  isEditModalOpen = false;

  newEmployee = {
    matricule:  '',
    nom:        '',
    prenom:     '',
    direction:  'IT',
    service:    '',
    fonction:   '',
    role:       'Employé',
    soldeConges: 0,
    telephone:  ''
  };

  editTarget: any  = null;
  editError        = '';
  editSaving       = false;

  searchQuery    = '';
  filterFonction = '';
  filterRole     = '';

  get uniqueFonctions(): string[] {
    const set = new Set<string>();
    for (const emp of this.employees) {
      const f = (emp.fonction ?? '').trim();
      if (f) set.add(f);
    }
    return Array.from(set).sort();
  }

  get filteredEmployees(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.employees.filter(emp => {
      const nom      = (emp.nom     ?? '').toLowerCase();
      const prenom   = (emp.prenom  ?? '').toLowerCase();
      const mat      = (emp.matricule ?? '').toLowerCase();
      const service  = (emp.service ?? '').toLowerCase();
      const fonction = (emp.fonction ?? '').toLowerCase();
      const matchQ        = !q || nom.includes(q) || prenom.includes(q) || mat.includes(q) || service.includes(q) || fonction.includes(q);
      const matchFonction = !this.filterFonction || fonction === this.filterFonction.toLowerCase();
      const matchRole     = !this.filterRole || (emp.role ?? '') === this.filterRole;
      return matchQ && matchFonction && matchRole;
    });
  }

  applyFilters(): void {
    this.cdr.detectChanges();
  }

  ngOnInit(): void { this.chargerPersonnel(); }

  chargerPersonnel(): void {
    this.isLoading = true;
    this.erreur    = '';
    this.http.get<any[]>(`${API}/api/employes`).subscribe({
      next: (data) => {
        this.employees = (data ?? []).map(e => this.normalize(e));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erreur    = err?.error?.message ?? 'Impossible de charger la liste du personnel. Vérifiez votre connexion.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openModal(): void  { this.isModalOpen = true;  this.erreur = ''; this.successMsg = ''; }
  closeModal(): void { this.isModalOpen = false; this.resetNewEmployee(); }

  resetNewEmployee(): void {
    this.newEmployee = { matricule: '', nom: '', prenom: '', direction: 'IT', service: '', fonction: '', role: 'Employé', soldeConges: 0, telephone: '' };
  }

  addEmployee(): void {
    if (!this.newEmployee.matricule || !this.newEmployee.nom || !this.newEmployee.prenom) {
      this.erreur = 'Matricule, nom et prénom sont obligatoires.';
      return;
    }
    this.actionLoading = true;
    this.erreur        = '';
    this.http.post(`${API}/api/employes`, {
      matricule:   this.newEmployee.matricule.trim().toUpperCase(),
      nom:         this.newEmployee.nom.trim(),
      prenom:      this.newEmployee.prenom.trim(),
      direction:   this.newEmployee.direction,
      service:     this.newEmployee.service.trim(),
      fonction:    this.newEmployee.fonction.trim(),
      role:        this.mapRole(this.newEmployee.role),
      soldeConges: Number(this.newEmployee.soldeConges),
      telephone:   this.newEmployee.telephone.trim()
    }).subscribe({
      next: () => {
        this.actionLoading = false;
        this.successMsg    = `Employé ${this.newEmployee.prenom} ${this.newEmployee.nom} ajouté avec succès.`;
        this.closeModal();
        this.cdr.detectChanges();
        this.chargerPersonnel();
      },
      error: (err) => {
        this.actionLoading = false;
        this.erreur        = err?.error?.message ?? err?.error?.Message ?? err?.error ?? 'Erreur lors de l\'ajout.';
        this.cdr.detectChanges();
      }
    });
  }

  openEditModal(emp: any): void {
    this.editTarget      = { ...emp };
    this.editError       = '';
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editTarget      = null;
    this.editError       = '';
  }

  saveEdit(): void {
    if (!this.editTarget) return;
    this.editSaving = true;
    this.editError  = '';
    this.http.put(`${API}/api/employes/${this.editTarget.matricule}`, {
      nom:         (this.editTarget.nom ?? '').trim(),
      prenom:      (this.editTarget.prenom ?? '').trim(),
      direction:   this.editTarget.direction,
      service:     (this.editTarget.service ?? '').trim(),
      fonction:    (this.editTarget.fonction ?? '').trim(),
      role:        this.mapRole(this.editTarget.role),
      soldeConges: Number(this.editTarget.solde ?? 0)
    }).subscribe({
      next: () => {
        this.editSaving = false;
        this.successMsg = 'Employé modifié avec succès.';
        this.closeEditModal();
        this.cdr.detectChanges();
        this.chargerPersonnel();
      },
      error: (err) => {
        this.editSaving = false;
        this.editError  = err?.error?.message ?? err?.error?.Message ?? err?.error ?? 'Erreur lors de la modification.';
        this.cdr.detectChanges();
      }
    });
  }

  deactivateEmployee(emp: any): void {
    const matricule = emp.matricule ?? '';
    const id        = emp.id        ?? '';
    if (!confirm(`Désactiver l'employé ${emp.prenom ?? ''} ${emp.nom ?? ''} ?`)) return;
    this.actionLoading = true;
    this.erreur        = '';
    this.http.patch(`${API}/api/employes/${id}/desactiver`, {}).subscribe({
      next: () => {
        this.actionLoading = false;
        this.successMsg    = `Employé ${matricule} désactivé.`;
        this.cdr.detectChanges();
        this.chargerPersonnel();
      },
      error: (err) => {
        this.actionLoading = false;
        this.erreur        = err?.error?.message ?? err?.error ?? 'Erreur lors de la désactivation.';
        this.cdr.detectChanges();
      }
    });
  }

  getField(emp: any, ...keys: string[]): string {
    for (const k of keys) { if (emp[k] != null) return emp[k]; }
    return '';
  }

  getInitiales(emp: any): string {
    const prenom = (emp.prenom ?? '');
    const nom    = (emp.nom    ?? '');
    return ((prenom.charAt(0) || '') + (nom.charAt(0) || '')).toUpperCase() || '?';
  }

  private normalize(e: any): any {
    return {
      id:          e.id          ?? e.Id          ?? '',
      matricule:   e.matricule   ?? e.Matricule   ?? '',
      nom:         e.nom         ?? e.Nom         ?? '',
      prenom:      e.prenom      ?? e.Prenom      ?? '',
      direction:   e.direction   ?? e.Direction   ?? '',
      service:     e.service     ?? e.Service     ?? '',
      fonction:    e.fonction    ?? e.Fonction    ?? e.poste ?? e.Poste ?? '',
      role:        this.displayRole(e.role ?? e.Role ?? ''),
      solde:       e.soldeConges ?? e.SoldeConges ?? e.solde ?? e.Solde ?? 0,
      soldeConges: e.soldeConges ?? e.SoldeConges ?? e.solde ?? e.Solde ?? 0,
      telephone:   e.telephone   ?? e.Telephone   ?? '',
      isActive:    e.isActive    ?? e.IsActive    ?? true
    };
  }

  private mapRole(display: string): string {
    const map: Record<string, string> = {
      'Employé': 'employe', 'SH': 'n1', 'DG': 'dg', 'RH': 'rh', 'Admin': 'admin'
    };
    return map[display] ?? display.toLowerCase();
  }

  private displayRole(raw: string): string {
    const map: Record<string, string> = {
      employe: 'Employé', n1: 'SH', dg: 'DG', rh: 'RH', admin: 'Admin'
    };
    return map[raw] ?? map[raw?.toLowerCase()] ?? raw;
  }
}
