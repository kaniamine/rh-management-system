import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-home-employee',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-employee.html',
  styleUrl: './home-employee.css'
})
export class HomeEmployee implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly cdr  = inject(ChangeDetectorRef);

  private readonly matricule = this.auth.session?.matricule ?? 'EMP-2026-014';

  get role(): string { return this.auth.role; }

  employee = {
    nom: '',
    matricule: this.matricule,
    poste: '',
    service: ''
  };

  stats = [
    { label: 'Demandes en attente', value: '--', tone: 'green' }
  ];

  soldeConges: number | null = null;
  isLoadingSolde = true;

  ngOnInit(): void {
    this.loadEmploye();
  }

  private loadEmploye(): void {
    this.http
      .get<any>(`/api/employes/${this.matricule}`)
      .subscribe({
        next: (emp) => {
          this.employee.nom     = emp.nomComplet ?? `${emp.prenom ?? ''} ${emp.nom ?? ''}`.trim();
          this.employee.poste   = emp.fonction ?? '';
          this.employee.service = emp.service ?? '';
          this.soldeConges      = emp.soldeConges ?? emp.SoldeConges ?? emp.solde ?? this.auth.session?.soldeConges ?? null;
          this.isLoadingSolde   = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.soldeConges    = this.auth.session?.soldeConges ?? null;
          this.isLoadingSolde = false;
          this.cdr.detectChanges();
        }
      });
  }
}