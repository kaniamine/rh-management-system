import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../../../core/auth.service';
import { Conge } from '../../../conge/services/conge';
import { Maladie } from '../../../conge/services/maladie';
import { Autorisation } from '../../../conge/services/autorisation';

export interface DemUnif {
  id:        number;
  _type:     'conge' | 'maladie' | 'autorisation';
  employe:   string;
  matricule: string;
  statut:    string;
  dateDebut: string;
  dateFin:   string;
  typeLabel: string;
  motif:     string;
  raw:       any;
}

@Component({
  selector:    'app-consulter-demandes',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './consulter-demandes.html',
  styleUrls:   ['./consulter-demandes.css']
})
export class ConsulterDemandes implements OnInit {
  private readonly auth     = inject(AuthService);
  private readonly congeSvc = inject(Conge);
  private readonly maladSvc = inject(Maladie);
  private readonly autoSvc  = inject(Autorisation);

  allDemandes: DemUnif[] = [];
  loading = true;
  error   = '';

  activeTab: 'toutes' | 'conge' | 'maladie' | 'autorisation' = 'toutes';

  filterStatut = '';
  filterSearch = '';
  filterDate   = '';

  // Clôturer modal
  cloturerTarget:  DemUnif | null = null;
  cloturerComment  = '';
  cloturerLoading  = false;
  cloturerError    = '';

  // Approuver modal
  approuverTarget:  DemUnif | null = null;
  approuverComment  = '';
  approuverLoading  = false;
  approuverError    = '';

  // Rejeter modal
  rejectTarget:  DemUnif | null = null;
  rejectComment  = '';
  rejectLoading  = false;
  rejectError    = '';

  get matricule(): string { return this.auth.session?.matricule ?? ''; }

  get allStatuts(): string[] {
    return [...new Set(this.allDemandes.map(d => d.statut))].sort();
  }

  get counts() {
    return {
      toutes:       this.allDemandes.length,
      conge:        this.allDemandes.filter(d => d._type === 'conge').length,
      maladie:      this.allDemandes.filter(d => d._type === 'maladie').length,
      autorisation: this.allDemandes.filter(d => d._type === 'autorisation').length,
      enAttente:    this.allDemandes.filter(d => d.statut.toLowerCase().includes('attente')).length,
    };
  }

  get filtered(): DemUnif[] {
    let list = this.activeTab === 'toutes'
      ? this.allDemandes
      : this.allDemandes.filter(d => d._type === this.activeTab);

    if (this.filterStatut) {
      list = list.filter(d => d.statut === this.filterStatut);
    }
    if (this.filterSearch.trim()) {
      const q = this.filterSearch.toLowerCase();
      list = list.filter(d =>
        d.employe.toLowerCase().includes(q) ||
        d.matricule.toLowerCase().includes(q)
      );
    }
    if (this.filterDate) {
      list = list.filter(d => d.dateDebut >= this.filterDate);
    }
    return list;
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading     = true;
    this.error       = '';
    this.allDemandes = [];

    forkJoin({
      conges:        this.congeSvc.getDemandes().pipe(catchError(() => of([]))),
      maladies:      this.maladSvc.getDemandes().pipe(catchError(() => of([]))),
      autorisations: this.autoSvc.getDemandes().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ conges, maladies, autorisations }) => {
        this.allDemandes = [
          ...this.normalizeConges(conges),
          ...this.normalizeMaladies(maladies),
          ...this.normalizeAutorisations(autorisations)
        ].sort((a, b) => (b.dateDebut > a.dateDebut ? 1 : -1));
        this.loading = false;
      },
      error: err => {
        this.error   = err?.error?.message ?? 'Erreur de chargement.';
        this.loading = false;
      }
    });
  }

  private normalizeConges(data: any[]): DemUnif[] {
    return (data ?? []).map(d => ({
      id:        d.id        ?? d.Id        ?? 0,
      _type:     'conge' as const,
      employe:   d.nomComplet ?? d.nom_complet ?? d.NomComplet ?? '',
      matricule: d.matricule  ?? d.Matricule  ?? '',
      statut:    d.statut     ?? d.Statut     ?? '',
      dateDebut: (d.dateDebut ?? d.date_debut ?? d.DateDebut ?? '').slice(0, 10),
      dateFin:   (d.dateFin   ?? d.date_fin   ?? d.DateFin   ?? '').slice(0, 10),
      typeLabel: this.labelTypeConge(d.typeConge ?? d.TypeConge ?? ''),
      motif:     d.motif ?? d.Motif ?? '',
      raw:       d
    }));
  }

  private normalizeMaladies(data: any[]): DemUnif[] {
    return (data ?? []).map(d => ({
      id:        d.id        ?? d.Id        ?? 0,
      _type:     'maladie' as const,
      employe:   d.nomComplet ?? d.nom_complet ?? d.NomComplet ?? '',
      matricule: d.matricule  ?? d.Matricule  ?? '',
      statut:    d.statut     ?? d.Statut     ?? '',
      dateDebut: (d.dateDebut ?? d.date_debut ?? d.DateDebut ?? '').slice(0, 10),
      dateFin:   (d.dateFin   ?? d.date_fin   ?? d.DateFin   ?? '').slice(0, 10),
      typeLabel: 'Congé maladie',
      motif:     d.motif ?? d.description ?? d.Motif ?? '',
      raw:       d
    }));
  }

  private normalizeAutorisations(data: any[]): DemUnif[] {
    return (data ?? []).map(d => {
      const date = (d.dateDemande ?? d.date_demande ?? d.DateDemande ?? '').slice(0, 10);
      return {
        id:        d.id        ?? d.Id        ?? 0,
        _type:     'autorisation' as const,
        employe:   d.nomComplet ?? d.nom_complet ?? d.NomComplet ?? '',
        matricule: d.matricule  ?? d.Matricule  ?? '',
        statut:    d.statut     ?? d.Statut     ?? '',
        dateDebut: date,
        dateFin:   date,
        typeLabel: 'Autorisation de sortie',
        motif:     d.motif ?? d.Motif ?? d.destination ?? '',
        raw:       d
      };
    });
  }

  private labelTypeConge(raw: string): string {
    const map: Record<string, string> = {
      annuel:       'Congé annuel',       ANNUEL:       'Congé annuel',
      CONGE_PAYE:   'Congé payé',         conge_paye:   'Congé payé',
      maladie:      'Congé maladie',      MALADIE:      'Congé maladie',
      maternite:    'Congé maternité',    MATERNITE:    'Congé maternité',
      exceptionnel: 'Congé exceptionnel', EXCEPTIONNEL: 'Congé exceptionnel',
      sans_solde:   'Congé sans solde',   SANS_SOLDE:   'Congé sans solde',
    };
    return map[raw] ?? (raw || 'Congé');
  }

  // ─── ACTION GUARDS ───────────────────────────────────────────────────────────

  canCloturer(d: DemUnif): boolean {
    if (d._type !== 'conge') return false;
    const s = d.statut;
    return (s.includes('Validée') || s.includes('traitement')) && !s.includes('Clôtur');
  }

  canApprouver(d: DemUnif): boolean {
    if (d._type === 'conge') return false;
    return d.statut.toLowerCase().includes('attente');
  }

  canRejeter(d: DemUnif): boolean {
    const s = d.statut.toLowerCase();
    return !s.includes('clôtur') && !s.includes('rejet') && !s.includes('annul');
  }

  // ─── CLÔTURER ────────────────────────────────────────────────────────────────

  openCloturer(d: DemUnif): void {
    this.cloturerTarget  = d;
    this.cloturerComment = '';
    this.cloturerError   = '';
  }

  closeCloturer(): void { this.cloturerTarget = null; }

  confirmCloturer(): void {
    const d = this.cloturerTarget;
    if (!d) return;
    this.cloturerLoading = true;
    this.cloturerError   = '';

    this.congeSvc.cloturer(d.id, this.matricule, this.cloturerComment).subscribe({
      next: () => {
        this.allDemandes = this.allDemandes.map(x =>
          x.id === d.id && x._type === 'conge' ? { ...x, statut: 'Clôturée' } : x
        );
        this.cloturerTarget  = null;
        this.cloturerLoading = false;
      },
      error: err => {
        this.cloturerError   = err?.error?.message ?? 'Erreur lors de la clôture.';
        this.cloturerLoading = false;
      }
    });
  }

  // ─── APPROUVER ───────────────────────────────────────────────────────────────

  openApprouver(d: DemUnif): void {
    this.approuverTarget  = d;
    this.approuverComment = '';
    this.approuverError   = '';
  }

  closeApprouver(): void { this.approuverTarget = null; }

  confirmApprouver(): void {
    const d = this.approuverTarget;
    if (!d) return;
    this.approuverLoading = true;
    this.approuverError   = '';

    const obs = d._type === 'maladie'
      ? this.maladSvc.valider(d.id, this.matricule, this.approuverComment)
      : this.autoSvc.validerN1(d.id, this.matricule, this.approuverComment);

    obs.subscribe({
      next: () => {
        this.approuverTarget  = null;
        this.approuverLoading = false;
        this.load();
      },
      error: err => {
        this.approuverError   = err?.error?.message ?? "Erreur lors de l'approbation.";
        this.approuverLoading = false;
      }
    });
  }

  // ─── REJETER ─────────────────────────────────────────────────────────────────

  openReject(d: DemUnif): void {
    this.rejectTarget  = d;
    this.rejectComment = '';
    this.rejectError   = '';
  }

  closeReject(): void { this.rejectTarget = null; }

  confirmReject(): void {
    const d = this.rejectTarget;
    if (!d) return;
    if (!this.rejectComment.trim()) {
      this.rejectError = 'Le motif de rejet est obligatoire.';
      return;
    }
    this.rejectLoading = true;
    this.rejectError   = '';

    const obs = d._type === 'conge'
      ? this.congeSvc.rejeterN1(d.id, this.matricule, this.rejectComment)
      : d._type === 'maladie'
        ? this.maladSvc.rejeter(d.id, this.matricule, this.rejectComment)
        : this.autoSvc.rejeterN1(d.id, this.matricule, this.rejectComment);

    obs.subscribe({
      next: () => {
        this.rejectTarget  = null;
        this.rejectLoading = false;
        this.load();
      },
      error: err => {
        this.rejectError   = err?.error?.message ?? 'Erreur lors du rejet.';
        this.rejectLoading = false;
      }
    });
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  exportCSV(): void {
    const rows = this.filtered;
    if (!rows.length) return;
    const headers = ['Type', 'Employé', 'Matricule', 'Début', 'Fin', 'Statut', 'Motif'];
    const lines = [
      headers.join(';'),
      ...rows.map(d =>
        [d.typeLabel, d.employe, d.matricule, d.dateDebut, d.dateFin, d.statut, d.motif]
          .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(';')
      )
    ];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `demandes-rh-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearFilters(): void {
    this.filterSearch = '';
    this.filterStatut = '';
    this.filterDate   = '';
  }

  formatDate(d: string): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch { return d; }
  }

  typeColor(t: 'conge' | 'maladie' | 'autorisation'): string {
    const map = { conge: '#ff5800', maladie: '#3b82f6', autorisation: '#0D776E' };
    return map[t] ?? '#999';
  }

  statutColor(s: string): string {
    const sl = s.toLowerCase();
    if (sl.includes('clôtur'))                             return '#64748b';
    if (sl.includes('valid') && !sl.includes('rejet'))     return '#22c55e';
    if (sl.includes('rejet') || sl.includes('annul'))      return '#c60c30';
    return '#f59e0b';
  }
}
