import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ParametrageService {
  private readonly http       = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean { return isPlatformBrowser(this.platformId); }

  // ── Lecture locale ────────────────────────────────────────
  getSection(section: string): any {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(`parametrage_${section}`);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  // ── Certificat médical ────────────────────────────────────
  // Clé : parametrage_maladie → { types, config: { certificatObligatoire } }
  isCertificatObligatoire(): boolean {
    const data = this.getSection('maladie');
    if (data?.config?.certificatObligatoire !== undefined) return Boolean(data.config.certificatObligatoire);
    if (data?.certificatObligatoire         !== undefined) return Boolean(data.certificatObligatoire);
    return true;
  }

  // ── Barème assiduité ──────────────────────────────────────
  // Clé : parametrage_assiduite → [{ tranche: '0 – 10 jours', points: 0 }, ...]
  getBareme(): any[] {
    const data = this.getSection('assiduite');
    if (Array.isArray(data) && data.length) return data;
    return [
      { tranche: '0 – 10 jours',  points: 0   },
      { tranche: '11 – 15 jours', points: 0.5 },
      { tranche: '16 – 20 jours', points: 1   },
      { tranche: '21 – 30 jours', points: 2   },
      { tranche: '> 30 jours',    points: 3   }
    ];
  }

  // Décode une ligne de barème vers { min, max }
  parsePalierRange(palier: any): { min: number; max: number } {
    const tranche: string = palier.tranche ?? '';
    if (tranche.startsWith('>')) {
      const val = parseInt(tranche.replace(/[^\d]/g, ''), 10);
      return { min: val + 1, max: Infinity };
    }
    const nums = tranche.match(/\d+/g);
    if (nums && nums.length >= 2) {
      return { min: parseInt(nums[0], 10), max: parseInt(nums[1], 10) };
    }
    // Format min/max direct (defaults)
    return { min: palier.min ?? 0, max: palier.max ?? 999 };
  }

  calculerDeduction(joursCumules: number): number {
    for (const palier of this.getBareme()) {
      const { min, max } = this.parsePalierRange(palier);
      if (joursCumules >= min && joursCumules <= max) {
        return palier.points ?? palier.deduction ?? 0;
      }
    }
    return 0;
  }

  // ── Workflow ──────────────────────────────────────────────
  // Clé : parametrage_workflow → tableau de steps { label, active, locked }
  getWorkflow(): { superieurHierarchiqueActif: boolean; directionGeneraleActive: boolean; rhActif: boolean } {
    const defaut = { superieurHierarchiqueActif: true, directionGeneraleActive: true, rhActif: true };
    if (!this.isBrowser) return defaut;

    const raw = localStorage.getItem('parametrage_workflow');
    if (!raw) return defaut;

    try {
      const parsed = JSON.parse(raw);

      // Format tableau (venant du composant Paramétrage)
      if (Array.isArray(parsed)) {
        const n1 = parsed.find((s: any) =>
          typeof s.label === 'string' && (
            s.label.toLowerCase().includes('n+1') ||
            s.label.toLowerCase().includes('responsable') ||
            s.label.toLowerCase().includes('supérieur')
          )
        );
        const dg = parsed.find((s: any) =>
          typeof s.label === 'string' && (
            s.label.toLowerCase().includes('direction générale') ||
            s.label.toLowerCase().includes('direction generale') ||
            s.label.toLowerCase().includes('dg')
          )
        );
        return {
          superieurHierarchiqueActif: n1?.active ?? true,
          directionGeneraleActive: dg?.active ?? true,
          rhActif: true
        };
      }

      // Format objet normalisé
      return {
        superieurHierarchiqueActif:
          parsed.superieurHierarchiqueActif ?? parsed.sh ?? parsed.n1 ?? parsed.superieur ?? true,
        directionGeneraleActive:
          parsed.directionGeneraleActive ?? parsed.dg ?? parsed.direction ?? true,
        rhActif: true
      };
    } catch {
      return defaut;
    }
  }

  getStatutInitialConge(): string {
    const workflow = this.getWorkflow();
    if (workflow.superieurHierarchiqueActif) return 'En attente de validation N+1';
    if (workflow.directionGeneraleActive) return 'En attente de validation DG';
    return 'Validée – En traitement RH';
  }

  getEtapesActives(): string[] {
    const workflow = this.getWorkflow();
    const etapes: string[] = [];
    if (workflow.superieurHierarchiqueActif) etapes.push('N+1');
    if (workflow.directionGeneraleActive) etapes.push('DG');
    etapes.push('RH');
    return etapes;
  }

  // ── Congés ────────────────────────────────────────────────
  // Clé : parametrage_conges → { delaiDepot: 2, ... }
  getDelaiMinimumConge(): number {
    const config = this.getSection('conges');
    return config?.delaiDepot ?? config?.delaiMinimumJours ?? 3;
  }

  // ── Autorisations ─────────────────────────────────────────
  // Clé : parametrage_autorisations → { dureeMaxPerso: 90, ... }
  getDureeMaxAutorisation(): number {
    const config = this.getSection('autorisations');
    return config?.dureeMaxPerso ?? config?.dureeMaxPersonnelleMinutes ?? 90;
  }

  // ── Sync backend (silencieux) ─────────────────────────────
  rechargerDepuisBackend(): void {
    if (!this.isBrowser) return;
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any>('http://localhost:5131/api/parametrage', { headers }).subscribe({
      next: (data) => {
        if (data) {
          Object.keys(data).forEach(key =>
            localStorage.setItem(`parametrage_${key}`, JSON.stringify(data[key]))
          );
          console.log('[ParametrageService] Rechargé depuis le backend');
        }
      },
      error: () => {}
    });
  }
}
