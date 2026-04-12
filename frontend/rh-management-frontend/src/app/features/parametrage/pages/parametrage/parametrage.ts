import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export type SectionId =
  | 'personnel' | 'roles' | 'conges' | 'workflow'
  | 'autorisations' | 'maladie' | 'assiduite' | 'notifications';

@Component({
  selector: 'app-parametrage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './parametrage.html',
  styleUrls: ['./parametrage.css']
})
export class Parametrage {

  activeSection: SectionId = 'personnel';
  savedSection: SectionId | null = null;

  readonly sections: { id: SectionId; label: string; desc: string }[] = [
    { id: 'personnel',     label: 'Base de données personnel',  desc: 'Référentiel RH' },
    { id: 'roles',         label: 'Profils & habilitations',    desc: 'Rôles et droits' },
    { id: 'conges',        label: 'Gestion des congés',         desc: 'Règles de calcul' },
    { id: 'workflow',      label: 'Circuits de validation',     desc: 'Workflow approbation' },
    { id: 'autorisations', label: 'Autorisations de sortie',    desc: 'Horaires et contrôles' },
    { id: 'maladie',       label: 'Congés de maladie',          desc: 'Types et règles' },
    { id: 'assiduite',     label: "Module d'assiduité",         desc: 'Barème de points' },
    { id: 'notifications', label: 'Notifications RH',           desc: 'Alertes automatiques' },
  ];

  // ── Section 1 : Personnel ────────────────────────────────
  personnelFields = [
    { key: 'matricule',     label: 'Matricule',                        required: true,  editable: false },
    { key: 'nom',           label: 'Nom / Prénom',                     required: true,  editable: true  },
    { key: 'direction',     label: 'Direction & Service',              required: true,  editable: true  },
    { key: 'fonction',      label: 'Fonction',                         required: false, editable: true  },
    { key: 'superieur',     label: 'Supérieur hiérarchique direct',    required: false, editable: true  },
    { key: 'solde',         label: 'Solde de congés',                  required: false, editable: true  },
    { key: 'autorisations', label: "Nature & nombre d'autorisations",  required: false, editable: true  },
  ];

  // ── Section 2 : Rôles & habilitations ───────────────────
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

  // ── Section 3 : Congés ───────────────────────────────────
  congesConfig = {
    uniteJoursOuvres:     true,
    inclusionWeekend:     true,
    inclusionFeries:      false,
    debitApresValidation: true,
    soldeMinimum:         1,
    delaiDepot:           2,
    motifObligatoire:     true,
  };

  // ── Section 4 : Workflow ─────────────────────────────────
  workflowSteps = [
    { label: 'Employé',            sublabel: 'Soumission de la demande',  locked: true,  active: true },
    { label: 'Responsable N+1',    sublabel: 'Validation hiérarchique',   locked: false, active: true },
    { label: 'Direction Générale', sublabel: 'Validation DG',             locked: false, active: true },
    { label: 'Direction RH',       sublabel: 'Traitement final',          locked: true,  active: true },
  ];

  // ── Section 5 : Autorisations ────────────────────────────
  autoriConfig = {
    matinDebut:    '08:00', matinFin:    '12:00',
    pauseDebut:    '12:00', pauseFin:    '13:00',
    apremDebut:    '13:00', apremFin:    '17:20',
    eteActif:      true,
    eteDebut:      '01/07', eteFin:      '31/08',
    eteHeureDebut: '07:30', eteHeureFin: '13:30',
    ramadanActif:  false,
    ramadanDebut:  '08:00', ramadanFin:  '14:30',
    dureeMaxPerso: 90,
    blocageAuto:   true,
  };

  // ── Section 6 : Maladie ──────────────────────────────────
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

  // ── Section 7 : Assiduité ────────────────────────────────
  bareme = [
    { tranche: '0 – 10 jours',  points: 0   },
    { tranche: '11 – 15 jours', points: 0.5 },
    { tranche: '16 – 20 jours', points: 1   },
    { tranche: '21 – 30 jours', points: 2   },
    { tranche: '> 30 jours',    points: 3   },
  ];

  // ── Section 8 : Notifications ────────────────────────────
  notifications = [
    { label: 'Soumission de demande', desc: "Envoyée à l'employé et au responsable N+1 lors de la création.", active: true  },
    { label: 'Validation / Rejet',    desc: "Informer l'employé du résultat à chaque étape du circuit.",     active: true  },
    { label: 'Clôture RH',            desc: "Notifier l'employé lorsque la RH finalise le dossier.",         active: true  },
    { label: 'Annulation',            desc: "Alerter les valideurs en cas d'annulation par l'employé.",      active: true  },
  ];

  // ── Helpers ──────────────────────────────────────────────
  selectSection(id: SectionId): void {
    this.activeSection = id;
    this.savedSection = null;
  }

  saveSection(): void {
    this.savedSection = this.activeSection;
    setTimeout(() => { this.savedSection = null; }, 3000);
  }
}
