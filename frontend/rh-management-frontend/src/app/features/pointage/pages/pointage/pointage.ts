import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector:    'app-pointage',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink, TitleCasePipe],
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

  // ── Pointage data ─────────────────────────────────────────────────────────────
  loading            = true;
  error              = '';
  statsPointageJour: any    = null;
  historiquePointage: any[] = [];
  pointagesFiltres:  any[]  = [];
  filtreDate     = '';
  filtreEmploye  = '';
  filtreStatut   = '';

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.startClock();
    this.chargerDonnees();
    this.refreshInterval = setInterval(() => this.chargerDonnees(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval)   clearInterval(this.clockInterval);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  chargerDonnees(): void {
    this.chargerHistoriquePointage();
  }

  private startClock(): void {
    const tick = () => {
      this.liveClock = new Date().toLocaleTimeString('fr-TN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    };
    tick();
    this.clockInterval = setInterval(tick, 1000);
  }

  private getToken(): string {
    return localStorage.getItem('token') ?? '';
  }

  chargerHistoriquePointage(): void {
    this.loading = true;
    this.error   = '';

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    this.http.get<any>('http://localhost:5131/api/pointage/stats-jour', { headers }).subscribe({
      next: data => { this.statsPointageJour = data; this.cdr.detectChanges(); },
      error: err => console.error('stats-pointage:', err)
    });

    this.http.get<any[]>('http://localhost:5131/api/pointage/historique-rh', { headers }).subscribe({
      next: (data) => {
        this.historiquePointage = data.map(p => ({
          ...p,
          dateRaw:     p.date ?? '',
          date:        p.date ? new Date(p.date).toLocaleDateString('fr-FR') : '—',
          heureEntree: p.heureEntree ? this.formaterHeure(p.heureEntree) : null,
          heureSortie: p.heureSortie ? this.formaterHeure(p.heureSortie) : null,
        }));
        this.pointagesFiltres = [...this.historiquePointage];
        this.loading          = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('historique-pointage:', err);
        this.error   = 'Impossible de charger l\'historique de pointage.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formaterHeure(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  }

  filtrerPointage(): void {
    this.pointagesFiltres = this.historiquePointage.filter(p => {
      const matchDate    = !this.filtreDate     || (p.dateRaw ?? '').startsWith(this.filtreDate);
      const matchEmploye = !this.filtreEmploye  ||
        (p.matricule ?? '').toLowerCase().includes(this.filtreEmploye.toLowerCase()) ||
        (p.nom       ?? '').toLowerCase().includes(this.filtreEmploye.toLowerCase());
      const matchStatut  = !this.filtreStatut   || p.statut === this.filtreStatut;
      return matchDate && matchEmploye && matchStatut;
    });
    this.cdr.detectChanges();
  }

  exportPDF(): void {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      doc.setFontSize(18);
      doc.setTextColor(255, 88, 0);
      doc.text('Historique de Pointage', 14, 18);

      doc.setFontSize(10);
      doc.setTextColor(94, 97, 103);
      doc.text('Al Baraka Assurances — Direction RH', 14, 26);
      doc.text(
        `Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
        14, 32
      );

      doc.setDrawColor(255, 88, 0);
      doc.setLineWidth(0.5);
      doc.line(14, 36, 283, 36);

      const donnees = this.pointagesFiltres;

      if (donnees.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(167, 169, 172);
        doc.text('Aucune donnée à exporter.', 14, 50);
      } else {
        const lignes = donnees.map((p: any) => [
          p.matricule ?? '—',
          `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() || '—',
          p.date ?? '—',
          p.heureEntree ?? '—',
          p.heureSortie ?? '—',
          p.duree ?? '—',
          p.retardMinutes > 0 ? `${p.retardMinutes} min` : 'À l\'heure',
          p.statut === 'present' ? 'Présent' :
          p.statut === 'retard'  ? 'En retard' :
          p.statut === 'absent'  ? 'Absent' : 'Incomplet'
        ]);

        autoTable(doc, {
          head: [['Matricule', 'Nom & Prénom', 'Date', 'Entrée', 'Sortie', 'Durée', 'Retard', 'Statut']],
          body: lignes,
          startY: 40,
          styles: { fontSize: 9, cellPadding: 3, textColor: [94, 97, 103] },
          headStyles: { fillColor: [255, 88, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 45 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
            6: { cellWidth: 25 },
            7: { cellWidth: 22 }
          }
        });
      }

      const pageCount = (doc as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(167, 169, 172);
        doc.text(`Page ${i} / ${pageCount}`, 283, 205, { align: 'right' });
        doc.text('Al Baraka Assurances — Confidentiel', 14, 205);
      }

      doc.save(`pointage-${new Date().toISOString().split('T')[0]}.pdf`);
      console.log('[EXPORT] PDF généré avec succès');
    } catch (err) {
      console.error('[EXPORT PDF ERROR]', err);
    }
  }

  exportExcel(): void {
    try {
      const donnees = this.pointagesFiltres;

      const lignes = donnees.map((p: any) => ({
        'Matricule':        p.matricule ?? '—',
        'Nom':              p.nom ?? '—',
        'Prénom':           p.prenom ?? '—',
        'Direction':        p.direction ?? '—',
        'Service':          p.service ?? '—',
        'Date':             p.date ?? '—',
        'Heure d\'entrée':  p.heureEntree ?? '—',
        'Heure de sortie':  p.heureSortie ?? '—',
        'Durée travaillée': p.duree ?? '—',
        'Retard (min)':     p.retardMinutes ?? 0,
        'Retard':           p.retardMinutes > 0 ? `${p.retardMinutes} min` : 'À l\'heure',
        'Statut':           p.statut === 'present' ? 'Présent' :
                            p.statut === 'retard'  ? 'En retard' :
                            p.statut === 'absent'  ? 'Absent' : 'Incomplet'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(lignes);
      ws['!cols'] = [
        { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 18 },
        { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 },
        { wch: 14 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Pointage');

      if (this.statsPointageJour) {
        const statsData = [
          { 'Indicateur': 'Présents aujourd\'hui',  'Valeur': this.statsPointageJour.presents    ?? 0 },
          { 'Indicateur': 'Absents aujourd\'hui',   'Valeur': this.statsPointageJour.absents     ?? 0 },
          { 'Indicateur': 'Retards aujourd\'hui',   'Valeur': this.statsPointageJour.retards     ?? 0 },
          { 'Indicateur': 'Durée moyenne ce mois',  'Valeur': this.statsPointageJour.dureeMoyenne ?? '—' }
        ];
        const wsStats = XLSX.utils.json_to_sheet(statsData);
        wsStats['!cols'] = [{ wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');
      }

      XLSX.writeFile(wb, `pointage-${new Date().toISOString().split('T')[0]}.xlsx`);
      console.log('[EXPORT] Excel généré avec succès');
    } catch (err) {
      console.error('[EXPORT EXCEL ERROR]', err);
    }
  }
}
