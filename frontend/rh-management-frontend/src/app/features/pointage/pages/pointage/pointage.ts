import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GeoValidationService } from '../../../../core/services/geo-validation.service';
import { COMPANY_CONFIG, ValidationResult } from '../../../../config/company.config';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PointageSession {
  id: string;
  date: string;          // YYYY-MM-DD
  checkIn: Date | null;
  checkOut: Date | null;
  method: string;
  gpsCoords?: { lat: number; lng: number };
  ip?: string;
  status: 'active' | 'completed' | 'missing-checkout';
  workedMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
}

export type HistoryView = 'day' | 'week' | 'month';

// ── Component ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-pointage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './pointage.html',
  styleUrls: ['./pointage.css']
})
export class Pointage implements OnInit, OnDestroy {

  private readonly geoSvc     = inject(GeoValidationService);
  private readonly platformId = inject(PLATFORM_ID);
  private get isBrowser(): boolean { return isPlatformBrowser(this.platformId); }

  // ── Validation state ────────────────────────────────────────────────────
  validating    = false;
  validation: ValidationResult | null = null;

  // ── Session state ───────────────────────────────────────────────────────
  activeSession: PointageSession | null = null;
  liveClock     = '';
  liveWorked    = '';
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  // ── History ─────────────────────────────────────────────────────────────
  readonly today = new Date();
  readonly todayLabel = this.today.toLocaleDateString('fr-TN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  historyView: HistoryView = 'week';
  exportFormat: 'pdf' | 'csv' = 'pdf';
  sessions: PointageSession[] = this.generateMockHistory();

  // ── Computed for active session ─────────────────────────────────────────
  get lateMinutes(): number {
    if (!this.activeSession?.checkIn) return 0;
    return this.computeLate(this.activeSession.checkIn);
  }

  get isLate(): boolean { return this.lateMinutes > 0; }

  get canCheckIn(): boolean {
    return !!this.validation?.allowed && !this.activeSession;
  }

  get canCheckOut(): boolean {
    return !!this.activeSession && this.activeSession.status === 'active';
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────
  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.startClock();
    this.runValidation();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  // ── Validation ──────────────────────────────────────────────────────────
  async runValidation(): Promise<void> {
    this.validating = true;
    this.validation = await this.geoSvc.validate();
    this.validating = false;
  }

  // ── Check-In ────────────────────────────────────────────────────────────
  checkIn(): void {
    if (!this.canCheckIn) return;
    const now = new Date();
    this.activeSession = {
      id: Math.random().toString(36).slice(2),
      date: this.toDateStr(now),
      checkIn: now,
      checkOut: null,
      method: this.validation!.label,
      status: 'active',
      workedMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes: this.computeLate(now)
    };
  }

  // ── Check-Out ───────────────────────────────────────────────────────────
  checkOut(): void {
    if (!this.canCheckOut || !this.activeSession?.checkIn) return;
    const now = new Date();
    const worked = this.computeWorkedMinutes(this.activeSession.checkIn, now);
    const standard = COMPANY_CONFIG.standardHoursPerDay * 60;
    this.activeSession = {
      ...this.activeSession,
      checkOut: now,
      status: 'completed',
      workedMinutes: worked,
      overtimeMinutes: Math.max(0, worked - standard),
      lateMinutes: this.computeLate(this.activeSession.checkIn)
    };
    this.sessions = [{ ...this.activeSession }, ...this.sessions];
    this.activeSession = null;
  }

  // ── Calculations ────────────────────────────────────────────────────────
  private computeLate(checkIn: Date): number {
    const [h, m] = COMPANY_CONFIG.workStartTime.split(':').map(Number);
    const start = new Date(checkIn);
    start.setHours(h, m + COMPANY_CONFIG.graceMinutes, 0, 0);
    const diff = Math.round((checkIn.getTime() - start.getTime()) / 60000);
    return Math.max(0, diff);
  }

  private computeWorkedMinutes(checkIn: Date, checkOut: Date): number {
    return Math.round((checkOut.getTime() - checkIn.getTime()) / 60000);
  }

  formatMinutes(mins: number): string {
    if (!mins || mins <= 0) return '--';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
  }

  // ── Clock ────────────────────────────────────────────────────────────────
  private startClock(): void {
    const tick = () => {
      const now = new Date();
      this.liveClock = now.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (this.activeSession?.checkIn) {
        const worked = this.computeWorkedMinutes(this.activeSession.checkIn, now);
        this.liveWorked = this.formatMinutes(worked);
      }
    };
    tick();
    this.clockInterval = setInterval(tick, 1000);
  }

  // ── History helpers ──────────────────────────────────────────────────────
  get filteredSessions(): PointageSession[] {
    const now = new Date();
    return this.sessions.filter(s => {
      const d = new Date(s.date);
      if (this.historyView === 'day') {
        return this.toDateStr(d) === this.toDateStr(now);
      }
      if (this.historyView === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);
      return d >= monthAgo;
    });
  }

  rowClass(s: PointageSession): string {
    if (s.status === 'missing-checkout') return 'row-missing';
    if (s.lateMinutes > 0)              return 'row-late';
    if (s.overtimeMinutes > 0)          return 'row-overtime';
    return '';
  }

  formatTime(d: Date | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });
  }

  private toDateStr(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  formatDateLabel(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-TN', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }

  // ── Export ───────────────────────────────────────────────────────────────
  exportReport(): void {
    if (this.exportFormat === 'csv') {
      this.exportCSV();
    } else {
      this.exportPDF();
    }
  }

  private exportCSV(): void {
    if (!this.isBrowser) return;
    const header = 'Date,Entrée,Sortie,Durée,H.Supp,Retard,Statut\n';
    const rows = this.filteredSessions.map(s =>
      [
        s.date,
        this.formatTime(s.checkIn),
        this.formatTime(s.checkOut),
        this.formatMinutes(s.workedMinutes),
        this.formatMinutes(s.overtimeMinutes),
        s.lateMinutes > 0 ? this.formatMinutes(s.lateMinutes) : '—',
        s.status === 'missing-checkout' ? 'Sortie manquante' :
        s.status === 'completed'        ? 'Complète' : 'Active'
      ].join(',')
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
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const orange = [255, 88, 0]  as [number,number,number];
    const teal   = [13, 119, 110] as [number,number,number];
    const gray   = [94, 97, 103]  as [number,number,number];

    // Header
    doc.setFillColor(...orange);
    doc.rect(0, 0, 297, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('alBaraka Assurances — Rapport de Pointage', 10, 12);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString('fr-TN'), 260, 12);

    // Table header
    const cols = ['Date', 'Entrée', 'Sortie', 'Durée', 'H. Supp', 'Retard', 'Statut'];
    const widths = [35, 25, 25, 25, 25, 25, 35];
    let x = 10; let y = 28;
    doc.setFillColor(...teal);
    doc.rect(8, y - 6, 281, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    cols.forEach((c, i) => { doc.text(c, x, y); x += widths[i]; });

    y += 6;
    this.filteredSessions.forEach(s => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      if (s.lateMinutes > 0)    doc.setTextColor(198, 12, 48);
      if (s.overtimeMinutes > 0) doc.setTextColor(...orange);
      if (s.status === 'missing-checkout') doc.setTextColor(167, 169, 172);
      x = 10;
      const vals = [
        this.formatDateLabel(s.date),
        this.formatTime(s.checkIn),
        this.formatTime(s.checkOut),
        this.formatMinutes(s.workedMinutes),
        this.formatMinutes(s.overtimeMinutes),
        s.lateMinutes > 0 ? this.formatMinutes(s.lateMinutes) : '—',
        s.status === 'missing-checkout' ? 'Sortie manquante' :
        s.status === 'completed'        ? 'Complète' : 'Active'
      ];
      vals.forEach((v, i) => { doc.text(v, x, y); x += widths[i]; });
      y += 7;
      if (y > 190) { doc.addPage(); y = 20; }
    });

    doc.save(`pointage_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  // ── Mock history ─────────────────────────────────────────────────────────
  private generateMockHistory(): PointageSession[] {
    const today = new Date();
    return [
      { id: '1', date: this.offsetDate(today, -1), checkIn: this.makeTime(today,-1,8,22), checkOut: this.makeTime(today,-1,17,35), method: '✓ Sur site',            status: 'completed',        workedMinutes: 553, overtimeMinutes: 13, lateMinutes: 0  },
      { id: '2', date: this.offsetDate(today, -2), checkIn: this.makeTime(today,-2,9, 5), checkOut: this.makeTime(today,-2,18,10), method: '✓ Réseau entreprise',    status: 'completed',        workedMinutes: 545, overtimeMinutes: 65, lateMinutes: 30 },
      { id: '3', date: this.offsetDate(today, -3), checkIn: this.makeTime(today,-3,8,28), checkOut: null,                          method: '✓ Sur site',            status: 'missing-checkout', workedMinutes: 0,   overtimeMinutes: 0,  lateMinutes: 0  },
      { id: '4', date: this.offsetDate(today, -4), checkIn: this.makeTime(today,-4,8,31), checkOut: this.makeTime(today,-4,17,30), method: '✓ Sur site',            status: 'completed',        workedMinutes: 539, overtimeMinutes: 0,  lateMinutes: 1  },
      { id: '5', date: this.offsetDate(today, -7), checkIn: this.makeTime(today,-7,8,15), checkOut: this.makeTime(today,-7,17,45), method: '✓ Réseau entreprise',   status: 'completed',        workedMinutes: 570, overtimeMinutes: 90, lateMinutes: 0  },
    ];
  }

  private offsetDate(base: Date, days: number): string {
    const d = new Date(base); d.setDate(d.getDate() + days);
    return this.toDateStr(d);
  }

  private makeTime(base: Date, days: number, h: number, m: number): Date {
    const d = new Date(base); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0);
    return d;
  }
}
