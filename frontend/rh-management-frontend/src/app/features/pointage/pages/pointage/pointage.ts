import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface PointageRecord {
  id?:            number;
  date:           string;
  heureEntree:    string | null;
  heureSortie:    string | null;
  duree:          string | null;
  retard:         string | null;
  retardMinutes?: number;
  statut:         string;
}

export type HistoryView = 'day' | 'week' | 'month';

@Component({
  selector:    'app-pointage',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './pointage.html',
  styleUrls:   ['./pointage.css']
})
export class Pointage implements OnInit, OnDestroy {
  private readonly http       = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr        = inject(ChangeDetectorRef);
  private get isBrowser(): boolean { return isPlatformBrowser(this.platformId); }

  // ── Clock ────────────────────────────────────────────────────────────────────
  liveClock  = '';
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  readonly today      = new Date();
  readonly todayLabel = this.today.toLocaleDateString('fr-TN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // ── Data ─────────────────────────────────────────────────────────────────────
  pointages:    PointageRecord[] = [];
  loading       = true;
  error         = '';
  historyView:  HistoryView    = 'week';
  exportFormat: 'pdf' | 'csv' = 'pdf';

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.startClock();
    this.chargerMonPointage();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  // ── Clock ────────────────────────────────────────────────────────────────────
  private startClock(): void {
    const tick = () => {
      this.liveClock = new Date().toLocaleTimeString('fr-TN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    };
    tick();
    this.clockInterval = setInterval(tick, 1000);
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  chargerMonPointage(): void {
    this.loading = true;
    this.error   = '';
    this.cdr.detectChanges();
    this.http.get<PointageRecord[]>('/api/pointage/mon-historique').subscribe({
      next: data => {
        this.pointages = data;
        this.loading   = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.error   = 'Impossible de charger l\'historique de pointage.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Computed ─────────────────────────────────────────────────────────────────
  get filteredPointages(): PointageRecord[] {
    const now   = new Date();
    const today = now.toISOString().slice(0, 10);
    return this.pointages.filter(p => {
      const d = new Date(p.date);
      if (this.historyView === 'day')  return p.date === today;
      if (this.historyView === 'week') {
        const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w;
      }
      const m = new Date(now); m.setDate(now.getDate() - 30); return d >= m;
    });
  }

  getStatutClass(statut: string): string {
    const s = (statut ?? '').toLowerCase();
    if (s === 'présent' || s === 'present') return 'st-ok';
    if (s.includes('retard'))               return 'st-late';
    if (s === 'absent')                     return 'st-missing';
    if (s.includes('incomplet'))            return 'st-missing';
    return 'st-ok';
  }

  // ── Export ───────────────────────────────────────────────────────────────────
  exportReport(): void {
    if (this.exportFormat === 'csv') this.exportCSV();
    else this.exportPDF();
  }

  private exportCSV(): void {
    if (!this.isBrowser) return;
    const header = 'Date,Entrée,Sortie,Durée,Retard,Statut\n';
    const rows   = this.filteredPointages.map(p =>
      [p.date, p.heureEntree ?? '—', p.heureSortie ?? '—', p.duree ?? '—', p.retard ?? '—', p.statut].join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `pointage_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  private async exportPDF(): Promise<void> {
    if (!this.isBrowser) return;
    const { default: jsPDF } = await import('jspdf');
    const doc    = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const orange = [255, 88, 0]   as [number,number,number];
    const teal   = [13, 119, 110] as [number,number,number];
    const gray   = [94, 97, 103]  as [number,number,number];

    doc.setFillColor(...orange);
    doc.rect(0, 0, 297, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('alBaraka Assurances — Rapport de Pointage', 10, 12);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString('fr-TN'), 260, 12);

    const cols   = ['Date', 'Entrée', 'Sortie', 'Durée', 'Retard', 'Statut'];
    const widths = [40, 28, 28, 28, 28, 40];
    let x = 10; let y = 28;
    doc.setFillColor(...teal);
    doc.rect(8, y - 6, 281, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    cols.forEach((c, i) => { doc.text(c, x, y); x += widths[i]; });

    y += 6;
    this.filteredPointages.forEach(p => {
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
      x = 10;
      [p.date, p.heureEntree ?? '—', p.heureSortie ?? '—', p.duree ?? '—', p.retard ?? '—', p.statut]
        .forEach((v, i) => { doc.text(v, x, y); x += widths[i]; });
      y += 7;
      if (y > 190) { doc.addPage(); y = 20; }
    });
    doc.save(`pointage_${new Date().toISOString().slice(0,10)}.pdf`);
  }
}
