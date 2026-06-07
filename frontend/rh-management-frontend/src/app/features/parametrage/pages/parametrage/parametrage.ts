import { Component, inject, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export type SectionId =
  | 'conges' | 'workflow'
  | 'autorisations' | 'plagesHoraires' | 'maladie' | 'assiduite';

@Component({
  selector: 'app-parametrage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './parametrage.html',
  styleUrls: ['./parametrage.css']
})
export class Parametrage implements OnInit {

  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr        = inject(ChangeDetectorRef);
  private readonly http       = inject(HttpClient);

  get isAdmin(): boolean {
    return isPlatformBrowser(this.platformId) && localStorage.getItem('isAdmin') === 'true';
  }

  activeSection: SectionId = 'conges';
  savedSection: SectionId | null = null;
  messageSucces = '';

  readonly sections: { id: SectionId; label: string; desc: string }[] = [
    { id: 'conges',         label: 'Gestion des congés',      desc: 'Règles de calcul'      },
    { id: 'workflow',       label: 'Circuits de validation',  desc: 'Workflow approbation'  },
    { id: 'autorisations',  label: 'Autorisations de sortie', desc: 'Horaires et contrôles' },
    { id: 'plagesHoraires', label: 'Plages horaires',         desc: 'Horaires de travail'   },
    { id: 'maladie',        label: 'Congés de maladie',       desc: 'Types et règles'       },
    { id: 'assiduite',      label: "Module d'assiduité",      desc: 'Barème de points'      },
  ];

  // ── Rôles (données partagées) ────────────────────────────
  readonly roles = [
    { id: 'employe', label: 'Employé' },
    { id: 'n1',      label: 'Responsable N+1' },
    { id: 'dg',      label: 'Direction Générale' },
    { id: 'rh',      label: 'Direction RH' },
  ];

  readonly permissions = [
    { id: 'create',    label: 'Création / modification / annulation de demandes' },
    { id: 'validate',  label: 'Validation ou rejet selon niveau hiérarchique' },
    { id: 'history',   label: 'Consultation des historiques' },
    { id: 'cloture',   label: 'Clôture RH' },
    { id: 'reporting', label: 'Extraction pour reporting' },
  ];

  rolePerms: Record<string, Record<string, boolean>> = {
    employe: { create: true,  validate: false, history: true,  cloture: false, reporting: false },
    n1:      { create: false, validate: true,  history: true,  cloture: false, reporting: false },
    dg:      { create: false, validate: true,  history: true,  cloture: false, reporting: true  },
    rh:      { create: true,  validate: true,  history: true,  cloture: true,  reporting: true  },
  };

  togglePerm(roleId: string, permId: string): void {
    this.rolePerms[roleId][permId] = !this.rolePerms[roleId][permId];
  }

  // ── Section 1 : Congés ───────────────────────────────────
  congesConfig = {
    uniteJoursOuvres:     true,
    inclusionWeekend:     true,
    inclusionFeries:      false,
    debitApresValidation: true,
    soldeMinimum:         1,
    delaiDepot:           2,
    motifObligatoire:     true,
  };

  // ── Section 2 : Workflow ─────────────────────────────────
  workflowSteps = [
    { label: 'Employé',            sublabel: 'Soumission de la demande',  locked: true,  active: true },
    { label: 'Responsable N+1',    sublabel: 'Validation hiérarchique',   locked: false, active: true },
    { label: 'Direction Générale', sublabel: 'Validation DG',             locked: false, active: true },
    { label: 'Direction RH',       sublabel: 'Traitement final',          locked: true,  active: true },
  ];

  // ── Section 3 : Autorisations (règles de contrôle seules) ─
  autoriConfig = {
    dureeMaxPerso: 90,
    blocageAuto:   true,
  };

  // ── Section 4 : Plages horaires ──────────────────────────
  plagesConfig = {
    matinDebut:    '08:00', matinFin:    '12:00',
    pauseDebut:    '12:00', pauseFin:    '13:00',
    apremDebut:    '13:00', apremFin:    '17:20',
    eteActif:      true,
    eteDebut:      '01/07', eteFin:      '31/08',
    eteHeureDebut: '07:30', eteHeureFin: '13:30',
    ramadanActif:  false,
    ramadanDebut:  '08:00', ramadanFin:  '14:30',
  };

  // ── Section 5 : Maladie ──────────────────────────────────
  maladieTypes = [
    { label: 'Maladie simple',  exempte: false },
    { label: 'Congé maternité', exempte: true  },
    { label: 'Congé chirurgie', exempte: true  },
  ];

  maladieConfig = {
    certificatObligatoire: true,
    validationRhOnly:      true,
    exclusionAssiduite:    true,
  };

  // ── Section 6 : Assiduité ────────────────────────────────
  bareme = [
    { tranche: '0 – 10 jours',  points: 0   },
    { tranche: '11 – 15 jours', points: 0.5 },
    { tranche: '16 – 20 jours', points: 1   },
    { tranche: '21 – 30 jours', points: 2   },
    { tranche: '> 30 jours',    points: 3   },
  ];

  // ── Lifecycle ────────────────────────────────────────────
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.chargerParametrages();
  }

  // ── Chargement depuis localStorage ──────────────────────
  private chargerParametrages(): void {
    const saved = (key: string) => {
      const raw = localStorage.getItem(`parametrage_${key}`);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    };

    const roles = saved('roles');
    if (roles) this.rolePerms = roles;

    const conges = saved('conges');
    if (conges) Object.assign(this.congesConfig, conges);

    const workflow = saved('workflow');
    if (workflow) {
      if (Array.isArray(workflow)) {
        this.workflowSteps = workflow;
      } else if (typeof workflow === 'object') {
        const shActif = workflow.superieurHierarchiqueActif ?? true;
        const dgActif = workflow.directionGeneraleActive ?? true;
        this.workflowSteps = this.workflowSteps.map((step: any, i: number) => ({
          ...step,
          active: i === 1 ? shActif : i === 2 ? dgActif : step.active
        }));
      }
    }

    const autorisations = saved('autorisations');
    if (autorisations) Object.assign(this.autoriConfig, autorisations);

    const plagesHoraires = saved('plagesHoraires');
    if (plagesHoraires) Object.assign(this.plagesConfig, plagesHoraires);

    const maladie = saved('maladie');
    if (maladie) {
      if (maladie.types)  this.maladieTypes  = maladie.types;
      if (maladie.config) Object.assign(this.maladieConfig, maladie.config);
    }

    const assiduite = saved('assiduite');
    if (assiduite) this.bareme = assiduite;

    this.chargerDepuisBackend();
    this.chargerPlagesDepuisBackend();
    this.chargerMaladieDepuisBackend();
  }

  private chargerDepuisBackend(): void {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.getToken()}` });

    this.http.get<any>('http://localhost:5131/api/parametrage', { headers }).subscribe({
      next: (data) => {
        if (!data) return;

        if (data.roles)         { this.rolePerms = data.roles; localStorage.setItem('parametrage_roles', JSON.stringify(data.roles)); }
        if (data.conges)        { Object.assign(this.congesConfig, data.conges); localStorage.setItem('parametrage_conges', JSON.stringify(data.conges)); }
        if (data.workflow)      { this.workflowSteps = data.workflow; localStorage.setItem('parametrage_workflow', JSON.stringify(data.workflow)); }
        if (data.autorisations) { Object.assign(this.autoriConfig, data.autorisations); localStorage.setItem('parametrage_autorisations', JSON.stringify(data.autorisations)); }
        if (data.maladie) {
          if (data.maladie.types)  this.maladieTypes = data.maladie.types;
          if (data.maladie.config) Object.assign(this.maladieConfig, data.maladie.config);
          localStorage.setItem('parametrage_maladie', JSON.stringify(data.maladie));
        }
        if (data.assiduite) { this.bareme = data.assiduite; localStorage.setItem('parametrage_assiduite', JSON.stringify(data.assiduite)); }

        this.cdr.detectChanges();
        console.log('[PARAMETRAGE] Données synchronisées depuis le backend');
      },
      error: () => {
        console.log('[PARAMETRAGE] Backend non disponible — données localStorage utilisées');
      }
    });
  }

  private chargerMaladieDepuisBackend(): void {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.getToken()}` });

    this.http.get<any>('http://localhost:5131/api/parametrage/conges-maladie', { headers }).subscribe({
      next: (data) => {
        if (!data) return;
        if (data.types)  this.maladieTypes = data.types;
        if (data.config) Object.assign(this.maladieConfig, data.config);
        localStorage.setItem('parametrage_maladie', JSON.stringify(data));
        this.cdr.detectChanges();
        console.log('[PARAMETRAGE] Congés maladie synchronisés depuis le backend');
      },
      error: () => {
        console.log('[PARAMETRAGE] Congés maladie — backend non disponible, localStorage utilisé');
      }
    });
  }

  private chargerPlagesDepuisBackend(): void {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.getToken()}` });

    this.http.get<any>('http://localhost:5131/api/parametrage/plages-horaires', { headers }).subscribe({
      next: (data) => {
        if (!data) return;
        Object.assign(this.plagesConfig, data);
        localStorage.setItem('parametrage_plagesHoraires', JSON.stringify(data));
        this.cdr.detectChanges();
        console.log('[PARAMETRAGE] Plages horaires synchronisées depuis le backend');
      },
      error: () => {
        console.log('[PARAMETRAGE] Plages horaires — backend non disponible, localStorage utilisé');
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────
  selectSection(id: SectionId): void {
    this.activeSection = id;
    this.savedSection  = null;
  }

  saveSection(): void {
    const donnees = this.getSectionData();
    const section = this.activeSection;

    console.log(`[PARAMETRAGE] Saving section "${section}":`, donnees);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
      'Content-Type':  'application/json'
    });

    // ── Plages horaires — endpoint dédié ─────────────────────
    if (section === 'plagesHoraires') {
      localStorage.setItem('parametrage_plagesHoraires', JSON.stringify(this.plagesConfig));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('parametrage-updated', { detail: { section } }));
      }
      console.log('[PARAMETRAGE] PUT /api/parametrage/plages-horaires →', this.plagesConfig);
      this.http.put(
        'http://localhost:5131/api/parametrage/plages-horaires',
        this.plagesConfig,
        { headers }
      ).subscribe({
        next:  () => { console.log('[PARAMETRAGE] Plages horaires sauvegardées en base'); this.cdr.detectChanges(); },
        error: (e) => { console.error('[PARAMETRAGE] Plages horaires — erreur backend:', e); this.cdr.detectChanges(); }
      });

    // ── Congés maladie — endpoint dédié ──────────────────────
    } else if (section === 'maladie') {
      const maladiePayload = { types: this.maladieTypes, config: this.maladieConfig };
      localStorage.setItem('parametrage_maladie', JSON.stringify(maladiePayload));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('parametrage-updated', { detail: { section } }));
      }
      console.log('[PARAMETRAGE] PUT /api/parametrage/conges-maladie →', maladiePayload);
      this.http.put(
        'http://localhost:5131/api/parametrage/conges-maladie',
        maladiePayload,
        { headers }
      ).subscribe({
        next:  () => { console.log('[PARAMETRAGE] Congés maladie sauvegardés en base'); this.cdr.detectChanges(); },
        error: (e) => { console.error('[PARAMETRAGE] Congés maladie — erreur backend:', e); this.cdr.detectChanges(); }
      });

    // ── Workflow — format normalisé ───────────────────────────
    } else if (section === 'workflow') {
      const steps: { label: string; active: boolean }[] = this.workflowSteps;
      const n1 = steps.find(s =>
        s.label.toLowerCase().includes('n+1') || s.label.toLowerCase().includes('responsable'));
      const dg = steps.find(s =>
        s.label.toLowerCase().includes('direction générale') ||
        s.label.toLowerCase().includes('direction generale'));
      const workflowConfig = {
        superieurHierarchiqueActif: n1?.active ?? true,
        directionGeneraleActive:    dg?.active ?? true,
        rhActif: true
      };
      localStorage.setItem('parametrage_workflow', JSON.stringify(workflowConfig));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('parametrage-updated', { detail: { section } }));
        window.dispatchEvent(new CustomEvent('workflow-updated', { detail: workflowConfig }));
      }
      console.log('[PARAMETRAGE] PUT /api/parametrage →', this.buildPayload());
      this.http.put('http://localhost:5131/api/parametrage', this.buildPayload(), { headers }).subscribe({
        next:  () => { console.log(`[PARAMETRAGE] Section "${section}" sauvegardée en base`); this.cdr.detectChanges(); },
        error: (e) => { console.error(`[PARAMETRAGE] Section "${section}" — erreur backend:`, e); this.cdr.detectChanges(); }
      });

    // ── Autres sections ───────────────────────────────────────
    } else {
      localStorage.setItem(`parametrage_${section}`, JSON.stringify(donnees));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('parametrage-updated', { detail: { section } }));
      }
      console.log(`[PARAMETRAGE] PUT /api/parametrage (section: ${section}) →`, this.buildPayload());
      this.http.put('http://localhost:5131/api/parametrage', this.buildPayload(), { headers }).subscribe({
        next:  () => { console.log(`[PARAMETRAGE] Section "${section}" sauvegardée en base`); this.cdr.detectChanges(); },
        error: (e) => { console.error(`[PARAMETRAGE] Section "${section}" — erreur backend:`, e); this.cdr.detectChanges(); }
      });
    }

    this.savedSection = section;
    setTimeout(() => { this.savedSection = null; this.cdr.detectChanges(); }, 3000);
  }

  private buildPayload(): object {
    return {
      rolePerms:     this.rolePerms,
      congesConfig:  this.congesConfig,
      workflowSteps: this.workflowSteps,
      autoriConfig:  this.autoriConfig,
      bareme:        this.bareme,
    };
  }

  private getSectionData(): any {
    const map: Record<SectionId, any> = {
      conges:         this.congesConfig,
      workflow:       this.workflowSteps,
      autorisations:  this.autoriConfig,
      plagesHoraires: this.plagesConfig,
      maladie:        { types: this.maladieTypes, config: this.maladieConfig },
      assiduite:      this.bareme,
    };
    return map[this.activeSection] ?? {};
  }

  private getToken(): string {
    return isPlatformBrowser(this.platformId)
      ? (localStorage.getItem('token') ?? '')
      : '';
  }
}
