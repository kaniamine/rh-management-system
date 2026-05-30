import {
  Component, OnInit, OnDestroy, inject,
  ElementRef, ViewChild, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { AnalyticsService, RhAnalytics } from '../../services/analytics.service';
import { AuthService } from '../../../../core/auth.service';

Chart.register(...registerables);

@Component({
  selector:    'app-rh-dashboard',
  standalone:  true,
  imports:     [CommonModule, RouterLink, DecimalPipe, TitleCasePipe, FormsModule],
  templateUrl: './rh-dashboard.html',
  styleUrls:   ['./rh-dashboard.css']
})
export class RhDashboard implements OnInit, OnDestroy {
  private analytics = inject(AnalyticsService);
  private auth      = inject(AuthService);
  private cdr       = inject(ChangeDetectorRef);
  private http      = inject(HttpClient);

  data:        RhAnalytics | null = null;
  loading      = true;
  error        = '';
  exporting    = false;
  chartsBuilt  = false;

  availableYears: number[] = [];
  selectedYear: number     = new Date().getFullYear();

  private charts: Chart[] = [];

  @ViewChild('c2') c2!: ElementRef<HTMLCanvasElement>;
  @ViewChild('c3') c3!: ElementRef<HTMLCanvasElement>;
  @ViewChild('c4') c4!: ElementRef<HTMLCanvasElement>;
  @ViewChild('c5') c5!: ElementRef<HTMLCanvasElement>;
  @ViewChild('c7') c7!: ElementRef<HTMLCanvasElement>;

  // ── Pointage section (RH only) ───────────────────────────────────────────────
  statsPointageJour: any         = null;
  historiquePointage: any[]      = [];
  pointagesFiltres:  any[]       = [];
  filtreDate     = '';
  filtreEmploye  = '';
  filtreStatut   = '';

  get currentRole(): string { return this.auth.role; }

  chargerPointagePersonnel(): void {
    this.http.get<any>('/api/pointage/stats-jour').subscribe({
      next: data => { this.statsPointageJour = data; this.cdr.detectChanges(); },
      error: err => console.error('stats-pointage:', err)
    });
    this.http.get<any[]>('/api/pointage/historique-rh').subscribe({
      next: data => {
        this.historiquePointage = data;
        this.pointagesFiltres   = data;
        this.cdr.detectChanges();
      },
      error: err => console.error('historique-pointage:', err)
    });
  }

  filtrerPointage(): void {
    this.pointagesFiltres = this.historiquePointage.filter(p => {
      const matchDate    = !this.filtreDate     || (p.date ?? '').startsWith(this.filtreDate);
      const matchEmploye = !this.filtreEmploye  ||
        (p.matricule ?? '').toLowerCase().includes(this.filtreEmploye.toLowerCase()) ||
        (p.nom       ?? '').toLowerCase().includes(this.filtreEmploye.toLowerCase());
      const matchStatut  = !this.filtreStatut   || p.statut === this.filtreStatut;
      return matchDate && matchEmploye && matchStatut;
    });
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.analytics.getAvailableYears().subscribe({
      next: (years) => {
        this.availableYears = years;
        if (!this.availableYears.includes(this.selectedYear))
          this.availableYears.unshift(this.selectedYear);
      }
    });
    this.load();
    if (this.auth.role === 'rh') {
      this.chargerPointagePersonnel();
    }
  }

  ngOnDestroy() { this.destroyCharts(); }

  get pageTitle(): string {
    return this.auth.role === 'dg'
      ? 'Tableau de bord — Direction Générale'
      : 'Tableau de bord analytique';
  }

  get pageSubtitle(): string {
    return this.auth.role === 'dg'
      ? 'Vue analytique des demandes RH — Al Baraka Assurances'
      : 'Statistiques et indicateurs de performance — Al Baraka Assurances';
  }

  onYearChange(year: number): void {
    this.selectedYear = Number(year);
    this.load();
  }

  load(): void {
    this.loading     = true;
    this.error       = '';
    this.chartsBuilt = false;
    this.destroyCharts();

    this.analytics.getRhDashboard(this.selectedYear).subscribe({
      next: d => {
        console.log('[ANALYTICS] Full response:', JSON.stringify(d));
        console.log('[FULL DATA KEYS]', Object.keys(d));
        console.log('[TYPE FIELD]', d.repartitionParType);
        console.log('[ANALYTICS] demandesParMois:', d.demandesParMois);
        console.log('[ANALYTICS] moyenneSoldeConges:', d.moyenneSoldeConges);
        console.log('[ANALYTICS] demandesParDirection:', d.demandesParDirection);
        this.data    = d;
        this.loading = false;
        this.cdr.detectChanges();
        requestAnimationFrame(() =>
          requestAnimationFrame(() => this.buildCharts())
        );
      },
      error: err => {
        this.error   = err?.error?.message ?? 'Erreur de chargement.';
        this.loading = false;
        console.error('[ANALYTICS]', err);
      }
    });
  }

  private destroyCharts(): void {
    this.charts.forEach(c => { try { c.destroy(); } catch (_) {} });
    this.charts      = [];
    this.chartsBuilt = false;
  }

  private buildCharts(): void {
    if (!this.data || this.chartsBuilt) return;
    if (!this.c2?.nativeElement) {
      setTimeout(() => this.buildCharts(), 150);
      return;
    }
    this.chartsBuilt = true;
    const d = this.data;

    const O = '#ff5800', T = '#0D776E', B = '#3b82f6',
          R = '#c60c30', P = '#8b5cf6', G = '#22c55e';
    const grid = '#f0f0f0';
    const opts = {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 500 } as any
    };

    // c2 — Doughnut: Répartition par type
    const typeLabelsMap: Record<string, string> = {
      'conge': 'Congés', 'CONGE': 'Congés', 'conge_paye': 'Congés',
      'CONGE_PAYE': 'Congés', 'demande_conge': 'Congés',
      'DEMANDE_CONGE': 'Congés', 'DemandeConge': 'Congés',
      'Conge': 'Congés', 'Congé': 'Congés', 'Congés': 'Congés',
      'autorisation': 'Autorisations', 'AUTORISATION': 'Autorisations',
      'autorisation_sortie': 'Autorisations', 'AUTORISATION_SORTIE': 'Autorisations',
      'DemandeAutorisation': 'Autorisations', 'Autorisation': 'Autorisations',
      'Autorisations': 'Autorisations',
      'maladie': 'Maladies', 'MALADIE': 'Maladies',
      'conge_maladie': 'Maladies', 'CONGE_MALADIE': 'Maladies',
      'DemandeMaladie': 'Maladies', 'DemandeCongesMaladie': 'Maladies',
      'Maladie': 'Maladies', 'Maladies': 'Maladies'
    };
    const typeColorsMap: Record<string, string> = {
      'Congés': '#ff5800',
      'Autorisations': '#0D776E',
      'Maladies': '#0073B0'
    };
    const resolveTypeLabel = (raw: string | null | undefined): string => {
      if (!raw) return 'Autre';
      return typeLabelsMap[raw] ?? typeLabelsMap[raw.toLowerCase()] ?? raw;
    };

    const raw = d.repartitionParType ?? [];
    console.log('[DOUGHNUT RAW]', JSON.stringify(raw));
    const typeLabels = raw.map((t: any) => {
      const key = t.type ?? t.Type ?? t.name ?? t.Name ?? t.label ?? t.Label ?? null;
      console.log('[DOUGHNUT KEY]', key, '→', resolveTypeLabel(key));
      return resolveTypeLabel(key);
    });
    const typeCounts = raw.map((t: any) =>
      t.count ?? t.Count ?? t.value ?? t.Value ?? 0
    );
    const typeColorList = typeLabels.map((lbl: string) => typeColorsMap[lbl] ?? '#999');
    console.log('[DOUGHNUT LABELS]', typeLabels);
    console.log('[DOUGHNUT COUNTS]', typeCounts);
    try {
      this.charts.push(new Chart(this.c2.nativeElement, {
        type: 'doughnut',
        data: {
          labels:   typeLabels,
          datasets: [{
            data:            typeCounts,
            backgroundColor: typeColorList,
            borderWidth:     3,
            borderColor:     '#fff',
            hoverOffset:     8
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 16,
                font: { size: 12 },
                generateLabels: (chart: any) => {
                  const data = chart.data;
                  return data.labels.map((label: string, i: number) => ({
                    text:        `${label}: ${data.datasets[0].data[i]}`,
                    fillStyle:   data.datasets[0].backgroundColor[i],
                    strokeStyle: data.datasets[0].backgroundColor[i],
                    lineWidth:   0,
                    hidden:      false,
                    index:       i
                  }));
                }
              }
            },
            tooltip: {
              callbacks: {
                label: (ctx: any) => {
                  const total = (ctx.dataset.data as number[])
                    .reduce((a: number, b: number) => a + b, 0);
                  const pct = total > 0
                    ? ((ctx.parsed / total) * 100).toFixed(1) : '0';
                  return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                }
              }
            }
          }
        }
      }));
    } catch (e) { console.error('c2', e); }

    // c3 — Bar horizontal: Par statut
    const statutLabels: Record<string, string> = {
      'Clôturée': 'Clôturée',
      'Validée': 'Validée',
      'En attente de validation N+1': 'Attente N+1',
      'En attente de validation DG': 'Attente DG',
      'En attente de validation RH': 'Attente RH',
      'En attente de validation du supérieur hiérarchique': 'Attente Sup.',
      'Rejetée par le supérieur hiérarchique': 'Rejeté Sup.',
      'Rejetée par la Direction Générale': 'Rejeté DG',
      'Validée – En traitement RH': 'En traitement RH',
      'Annulée': 'Annulée',
      'Brouillon': 'Brouillon'
    };
    try {
      this.charts.push(new Chart(this.c3.nativeElement, {
        type: 'bar',
        data: {
          labels:   (d.repartitionParStatut ?? []).map((s: any) => {
              const raw = s.statut ?? s.Statut ?? '';
              return statutLabels[raw] ?? (raw.length > 20 ? raw.slice(0, 20) + '…' : raw);
            }),
          datasets: [{
            label:           'Demandes',
            data:            (d.repartitionParStatut ?? []).map((s: any) => s.count ?? s.Count ?? 0),
            backgroundColor: [O, T, G, R, B, P, '#f59e0b', '#64748b', '#06b6d4', '#a855f7', '#14b8a6'],
            borderRadius:    6,
            borderWidth:     0
          }]
        },
        options: {
          ...opts,
          indexAxis: 'y' as const,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: grid } },
            y: { grid: { display: false }, ticks: { font: { size: 11 } } }
          }
        }
      }));
    } catch (e) { console.error('c3', e); }

    // c4 — Bar vertical: Par direction
    console.log('[DIR] demandesParDirection:', JSON.stringify(d.demandesParDirection));
    const dirNames = (d.demandesParDirection ?? []).map(dir => {
      const name = (dir as any).direction ?? (dir as any).Direction ?? '';
      return name
        .replace('Direction ', '')
        .replace('Ressources Humaines', 'RH')
        .replace('Générale', 'Gén.')
        || name;
    });
    const dirCounts = (d.demandesParDirection ?? []).map(dir =>
      (dir as any).count ?? (dir as any).Count ?? 0
    );
    console.log('[DIR] Labels:', dirNames, 'Counts:', dirCounts);
    try {
      this.charts.push(new Chart(this.c4.nativeElement, {
        type: 'bar',
        data: {
          labels:   dirNames,
          datasets: [{
            label:           'Demandes',
            data:            dirCounts,
            backgroundColor: [
              '#ff5800', '#0D776E', '#3b82f6',
              '#8b5cf6', '#22c55e', '#f59e0b',
              '#c60c30', '#64748b'
            ],
            borderRadius: 8,
            borderWidth:  0
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false } }
          }
        }
      }));
    } catch (e) { console.error('c4', e); }

    // c5 — Bar: Taux de validation par type
    try {
      this.charts.push(new Chart(this.c5.nativeElement, {
        type: 'bar',
        data: {
          labels:   ['Congés', 'Autorisations', 'Maladies'],
          datasets: [{
            label:           'Taux validation (%)',
            data:            [d.tauxValidationConge ?? 0, d.tauxValidationAuto ?? 0, d.tauxValidationMaladie ?? 0],
            backgroundColor: ['rgba(255,88,0,0.85)', 'rgba(13,119,110,0.85)', 'rgba(59,130,246,0.85)'],
            borderRadius:    8,
            borderWidth:     0
          }]
        },
        options: {
          ...opts,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true, max: 100,
              grid: { color: grid },
              ticks: { callback: (v: any) => v + '%' }
            },
            x: { grid: { display: false } }
          }
        }
      }));
    } catch (e) { console.error('c5', e); }

    // c7 — Horizontal bar: Top 5 employees
    if (d.topEmployes?.length && this.c7?.nativeElement) {
      try {
        this.charts.push(new Chart(this.c7.nativeElement, {
          type: 'bar',
          data: {
            labels: (d.topEmployes ?? []).map((e: any) =>
              (e.nomComplet ?? e.NomComplet ?? e.matricule ?? 'N/A')
                .split(' ').slice(0, 2).join(' ')
            ),
            datasets: [{
              label: 'Demandes',
              data:  (d.topEmployes ?? []).map(e => e.count ?? 0),
              backgroundColor: ['#ff5800', '#0D776E', '#3b82f6', '#8b5cf6', '#22c55e'],
              borderRadius: 8,
              borderWidth:  0
            }]
          },
          options: {
            indexAxis: 'y' as const,
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { beginAtZero: true, grid: { color: '#f0f0f0' } },
              y: { grid: { display: false } }
            }
          }
        }));
      } catch (e) { console.error('c7', e); }
    }

    console.log('[CHARTS] ✅ Built successfully');
  }

  private readonly _typeColorMap: Record<string, string> = {
    'Congés': '#ff5800', 'Autorisations': '#0D776E', 'Maladies': '#0073B0'
  };
  private readonly _typeLabelMap: Record<string, string> = {
    'conge': 'Congés', 'CONGE': 'Congés', 'conge_paye': 'Congés',
    'CONGE_PAYE': 'Congés', 'demande_conge': 'Congés',
    'DEMANDE_CONGE': 'Congés', 'DemandeConge': 'Congés',
    'Conge': 'Congés', 'Congé': 'Congés', 'Congés': 'Congés',
    'autorisation': 'Autorisations', 'AUTORISATION': 'Autorisations',
    'autorisation_sortie': 'Autorisations', 'AUTORISATION_SORTIE': 'Autorisations',
    'DemandeAutorisation': 'Autorisations', 'Autorisation': 'Autorisations',
    'Autorisations': 'Autorisations',
    'maladie': 'Maladies', 'MALADIE': 'Maladies',
    'conge_maladie': 'Maladies', 'CONGE_MALADIE': 'Maladies',
    'DemandeMaladie': 'Maladies', 'DemandeCongesMaladie': 'Maladies',
    'Maladie': 'Maladies', 'Maladies': 'Maladies'
  };

  getTypeName(t: any): string {
    const raw = t?.type ?? t?.Type ?? null;
    if (!raw) return 'N/A';
    return this._typeLabelMap[raw] ?? this._typeLabelMap[raw.toLowerCase()] ?? raw;
  }

  getTypeCount(t: any): number {
    return t?.count ?? t?.Count ?? 0;
  }

  getTypeColor(t: any): string {
    const name = this.getTypeName(t);
    return this._typeColorMap[name] ?? '#999';
  }

  async exportPDF(): Promise<void> {
    if (!this.data) return;
    this.exporting = true;
    try {
      // jsPDF v4 uses named export { jsPDF }, not default
      const { jsPDF } = await import('jspdf');
      const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210, H = 297;
      let y = 0;

      // Header band
      doc.setFillColor(255, 88, 0);
      doc.rect(0, 0, W, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(17); doc.setFont('helvetica', 'bold');
      doc.text('Al Baraka Assurances', 14, 13);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('Rapport Analytique RH — Direction des Ressources Humaines', 14, 22);
      doc.text(new Date().toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
      }), W - 14, 22, { align: 'right' });
      y = 40;

      // KPI grid
      doc.setTextColor(42, 45, 50);
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('Indicateurs Clés de Performance', 14, y); y += 8;

      const kpis: [string, string, number[]][] = [
        ['Total demandes',    String(this.data.totalDemandes),    [255, 88, 0]],
        ['Demandes validées', String(this.data.validees),         [13, 119, 110]],
        ['En attente',        String(this.data.enAttente),        [245, 158, 11]],
        ['Rejetées',          String(this.data.rejetees),         [198, 12, 48]],
        ['Taux de validation', this.data.tauxValidation + '%',    [13, 119, 110]],
        ['Taux de rejet',      this.data.tauxRejet + '%',         [198, 12, 48]],
        ['Jours congés pris', String(this.data.totalJoursConge),  [255, 88, 0]],
        ['Jours maladie',     String(this.data.totalJoursMaladie),[59, 130, 246]],
        ['Solde moy. congés', this.data.moyenneSoldeConges + ' j',[139, 92, 246]],
        ['Total employés',    String(this.data.totalEmployes),    [100, 116, 139]],
      ];

      const colW = (W - 32) / 2;
      doc.setFontSize(9);
      kpis.forEach(([label, val, rgb], i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x   = 14 + col * (colW + 4);
        const yy  = y + row * 10;
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(x, yy - 6, colW, 9, 2, 2, 'F');
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.rect(x, yy - 6, 2, 9, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(label, x + 5, yy);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        doc.text(val, x + colW - 3, yy, { align: 'right' });
      });
      y += Math.ceil(kpis.length / 2) * 10 + 12;

      // Charts
      const canvases = [
        { el: this.c2?.nativeElement, title: 'Répartition par type de demande' },
        { el: this.c3?.nativeElement, title: 'Demandes par statut' },
        { el: this.c4?.nativeElement, title: 'Demandes par direction' },
        { el: this.c5?.nativeElement, title: 'Taux de validation par type (%)' },
      ];

      for (const cfg of canvases) {
        if (!cfg.el) continue;
        try {
          const imgData = cfg.el.toDataURL('image/png', 1.0);
          const ratio   = cfg.el.height / cfg.el.width;
          const imgW    = W - 28;
          const imgH    = Math.min(imgW * ratio, 75);
          if (y + imgH + 18 > H - 10) { doc.addPage(); y = 15; }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(42, 45, 50);
          doc.text(cfg.title, 14, y); y += 4;
          doc.setFillColor(250, 250, 250);
          doc.roundedRect(13, y - 1, imgW + 2, imgH + 2, 3, 3, 'F');
          doc.addImage(imgData, 'PNG', 14, y, imgW, imgH);
          y += imgH + 12;
        } catch (err) {
          console.warn('[PDF] Chart skip:', cfg.title, err);
        }
      }

      // Footer
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFillColor(245, 245, 245);
        doc.rect(0, H - 10, W, 10, 'F');
        doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('Al Baraka Assurances — Document confidentiel RH', 14, H - 4);
        doc.text(`Page ${i} / ${pages}`, W - 14, H - 4, { align: 'right' });
      }

      doc.save(`rapport-rh-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('[PDF]', err);
      alert('Erreur PDF: ' + (err as any)?.message);
    }
    this.exporting = false;
  }
}
