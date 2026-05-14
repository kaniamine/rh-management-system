import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Employee {
  matricule: string;
  nom:       string;
  prenom:    string;
  direction: string;
  service:   string;
  fonction:  string;
  role:      string;
  solde:     number;
}

@Component({
  selector:    'app-personnel-list',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './personnel-list.html',
  styleUrls:   ['./personnel-list.css']
})
export class PersonnelList implements OnInit {
  private readonly http = inject(HttpClient);

  // ── Add modal ────────────────────────────────────────────────────────────────
  isModalOpen  = false;
  loading      = false;
  saving       = false;
  errorMessage = '';

  employees: Employee[] = [];

  newEmployee = {
    matricule: '',
    nom:       '',
    prenom:    '',
    direction: 'IT',
    service:   '',
    fonction:  '',
    role:      'Employé',
    solde:     0,
    telephone: ''
  };

  // ── Edit modal ───────────────────────────────────────────────────────────────
  isEditModalOpen = false;
  editSaving      = false;
  editError       = '';
  editTarget: {
    matricule: string; nom: string; prenom: string;
    direction: string; service: string; fonction: string;
    role: string; solde: number;
  } | null = null;

  // ─────────────────────────────────────────────────────────────────────────────

  ngOnInit(): void { this.loadEmployes(); }

  loadEmployes(): void {
    this.loading = true;
    this.http.get<any[]>('/api/employes').subscribe({
      next: data => {
        this.employees = (data ?? []).map(e => this.normalize(e));
        this.loading   = false;
      },
      error: err => {
        console.error('[EMPLOYES] Erreur chargement:', err);
        this.loading = false;
      }
    });
  }

  // ── Add ──────────────────────────────────────────────────────────────────────

  openModal(): void {
    this.errorMessage = '';
    this.isModalOpen  = true;
  }

  closeModal(): void {
    this.isModalOpen  = false;
    this.errorMessage = '';
    this.newEmployee  = {
      matricule: '', nom: '', prenom: '',
      direction: 'IT', service: '', fonction: '',
      role: 'Employé', solde: 0, telephone: ''
    };
  }

  addEmployee(): void {
    if (!this.newEmployee.matricule.trim() ||
        !this.newEmployee.nom.trim()       ||
        !this.newEmployee.prenom.trim()) {
      this.errorMessage = 'Matricule, nom et prénom sont obligatoires.';
      return;
    }

    const payload = {
      matricule:   this.newEmployee.matricule.trim().toUpperCase(),
      nom:         this.newEmployee.nom.trim(),
      prenom:      this.newEmployee.prenom.trim(),
      direction:   this.newEmployee.direction,
      service:     this.newEmployee.service.trim(),
      fonction:    this.newEmployee.fonction.trim(),
      role:        this.mapRole(this.newEmployee.role),
      soldeConges: Number(this.newEmployee.solde),
      telephone:   this.newEmployee.telephone.trim()
    };

    console.log('[ADD EMPLOYE] Payload being sent:', payload);
    this.saving = true; this.errorMessage = '';

    this.http.post<any>('/api/employes', payload).subscribe({
      next: res => {
        console.log('[ADD EMPLOYE] ✅ Saved:', res);
        this.saving = false;
        this.closeModal();
        this.loadEmployes();
      },
      error: err => {
        console.error('[ADD EMPLOYE] Full error:', err);
        console.error('[ADD EMPLOYE] Status:', err.status);
        console.error('[ADD EMPLOYE] Message:', err.error);
        this.saving       = false;
        this.errorMessage = err?.error?.message ?? err?.error?.Message
          ?? err?.error ?? 'Erreur lors de la création.';
      }
    });
  }

  // ── Edit (Issue 1) ───────────────────────────────────────────────────────────

  openEditModal(emp: Employee): void {
    this.editTarget = { ...emp };
    this.editError  = '';
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editTarget      = null;
    this.editError       = '';
  }

  saveEdit(): void {
    if (!this.editTarget) return;

    const payload = {
      nom:         this.editTarget.nom.trim(),
      prenom:      this.editTarget.prenom.trim(),
      direction:   this.editTarget.direction,
      service:     this.editTarget.service.trim(),
      fonction:    this.editTarget.fonction.trim(),
      role:        this.mapRole(this.editTarget.role),
      soldeConges: Number(this.editTarget.solde)
    };

    console.log('[MODIFIER] Payload being sent:', payload);
    this.editSaving = true;
    this.editError  = '';

    this.http.put<any>(
      `/api/employes/${this.editTarget.matricule}`, payload
    ).subscribe({
      next: () => {
        console.log('[MODIFIER] ✅ Saved');
        this.editSaving = false;
        this.closeEditModal();
        this.loadEmployes();
      },
      error: err => {
        console.error('[MODIFIER] ❌', err);
        this.editSaving = false;
        this.editError  = err?.error?.message ?? err?.error?.Message
          ?? 'Erreur lors de la modification.';
      }
    });
  }

  // ── Désactiver (Issue 2) ─────────────────────────────────────────────────────

  desactiver(matricule: string): void {
    if (!confirm(`Désactiver l'employé ${matricule} ?`)) return;

    this.http.patch<any>(`/api/employes/${matricule}/desactiver`, {}).subscribe({
      next: () => {
        console.log('[DESACTIVER] ✅ Done');
        this.loadEmployes();
      },
      error: err => console.error('[DESACTIVER] ❌', err)
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private normalize(e: any): Employee {
    return {
      matricule: e.matricule ?? e.Matricule ?? '',
      nom:       e.nom       ?? e.Nom       ?? '',
      prenom:    e.prenom    ?? e.Prenom    ?? '',
      direction: e.direction ?? e.Direction ?? '',
      service:   e.service   ?? e.Service   ?? '',
      fonction:  e.fonction  ?? e.Fonction  ?? e.poste ?? e.Poste ?? '',
      role:      this.displayRole(e.role ?? e.Role ?? ''),
      solde:     e.soldeConges ?? e.SoldeConges ?? e.solde ?? e.Solde ?? 0
    };
  }

  private mapRole(display: string): string {
    const map: Record<string, string> = {
      'Employé': 'employe', 'SH': 'n1',
      'DG':      'dg',      'RH': 'rh', 'Admin': 'admin'
    };
    return map[display] ?? display.toLowerCase();
  }

  private displayRole(raw: string): string {
    const map: Record<string, string> = {
      employe: 'Employé', n1: 'SH', dg: 'DG', rh: 'RH', admin: 'Admin',
      Employe: 'Employé', N1: 'SH', Dg: 'DG', Rh: 'RH', Admin: 'Admin'
    };
    return map[raw] ?? map[raw?.toLowerCase()] ?? raw;
  }
}
