import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-mon-profil',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './mon-profil.html',
  styleUrl: './mon-profil.css'
})
export class MonProfil implements OnInit {
  private readonly auth       = inject(AuthService);
  private readonly http       = inject(HttpClient);
  private readonly cdr        = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);

  totalDemandes    = 0;
  demandesValidees = 0;
  demandesRejetees = 0;
  demandesAttente  = 0;
  statsLoading     = true;

  // ── Téléphone ────────────────────────────────────────────────────────────────
  showFormTelephone     = false;
  telephoneActuel:       string | null = null;
  nouveauTelephone      = '';
  confirmationTelephone = '';
  erreurTelephone       = '';
  succesTelephone       = '';
  isLoadingTelephone    = false;

  get session() { return this.auth.session; }
  get isRh(): boolean { return this.auth.role === 'rh'; }
  get isAdmin(): boolean {
    return isPlatformBrowser(this.platformId) && localStorage.getItem('isAdmin') === 'true';
  }

  get roleLabel(): string {
    const map: Record<string, string> = {
      employe: 'Employé',
      n1:      'Responsable N+1',
      dg:      'Direction Générale',
      rh:      'Direction RH',
      admin:   'Direction RH'
    };
    return map[this.auth.role] ?? this.auth.role;
  }

  get initiales(): string {
    const nom = this.session?.nomComplet ?? '';
    const parts = nom.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  get soldeBarWidth(): string {
    const solde = this.session?.soldeConges ?? 0;
    const pct = Math.min(100, Math.round((solde / 30) * 100));
    return `${pct}%`;
  }

  get soldeBarColor(): string {
    const solde = this.session?.soldeConges ?? 0;
    if (solde <= 5)  return '#c60c30';
    if (solde <= 10) return '#f0a500';
    return '#0D776E';
  }

  ngOnInit(): void {
    const matricule = this.session?.matricule;
    if (!matricule) { this.statsLoading = false; return; }

    // Initialise le téléphone depuis la session si disponible
    this.telephoneActuel = (this.session as any)?.telephone ?? null;

    forkJoin({
      conges:        this.http.get<any[]>(`/api/demandes-conge?matricule=${matricule}`).pipe(catchError(() => of([]))),
      autorisations: this.http.get<any[]>(`/api/demandes-autorisation?matricule=${matricule}`).pipe(catchError(() => of([]))),
      maladies:      this.http.get<any[]>(`/api/demandes-maladie?matricule=${matricule}`).pipe(catchError(() => of([]))),
      profil:        this.http.get<any>(`/api/employes/${matricule}`).pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ conges, autorisations, maladies, profil }) => {
        const all = [...conges, ...autorisations, ...maladies];
        this.totalDemandes    = all.length;
        this.demandesValidees = all.filter(d =>
          d.statut === 'Clôturée' || (d.statut ?? '').startsWith('Validée')
        ).length;
        this.demandesRejetees = all.filter(d =>
          (d.statut ?? '').startsWith('Rejetée') || d.statut === 'Annulée'
        ).length;
        this.demandesAttente  = all.filter(d =>
          (d.statut ?? '').startsWith('En attente')
        ).length;
        if (profil) {
          this.telephoneActuel = profil.telephone ?? profil.Telephone ?? this.telephoneActuel;
        }
        this.statsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.statsLoading = false; this.cdr.detectChanges(); }
    });
  }

  // ── Téléphone ────────────────────────────────────────────────────────────────

  toggleFormTelephone(): void {
    this.showFormTelephone    = !this.showFormTelephone;
    this.nouveauTelephone     = '';
    this.confirmationTelephone = '';
    this.erreurTelephone      = '';
    this.succesTelephone      = '';
  }

  validerTelephone(tel: string): boolean {
    const nettoye = tel.replace(/[\s\-\.\(\)\+]/g, '');
    const numero  = nettoye.startsWith('00216')
      ? nettoye.substring(5)
      : nettoye.startsWith('216')
      ? nettoye.substring(3)
      : nettoye;
    return /^[0-9]{8}$/.test(numero);
  }

  changerTelephone(): void {
    this.erreurTelephone  = '';
    this.succesTelephone  = '';

    if (!this.nouveauTelephone.trim() || !this.confirmationTelephone.trim()) {
      this.erreurTelephone = 'Tous les champs sont obligatoires.';
      return;
    }
    if (!this.validerTelephone(this.nouveauTelephone)) {
      this.erreurTelephone = 'Le numéro de téléphone est invalide. Entrez un numéro tunisien valide (8 chiffres).';
      return;
    }
    if (this.nouveauTelephone.trim() !== this.confirmationTelephone.trim()) {
      this.erreurTelephone = 'Les deux numéros ne correspondent pas.';
      return;
    }
    if (this.telephoneActuel &&
        this.nouveauTelephone.replace(/[\s\-\.]/g, '') ===
        this.telephoneActuel.replace(/[\s\-\.]/g, '')) {
      this.erreurTelephone = 'Le nouveau numéro est identique à l\'actuel.';
      return;
    }

    this.isLoadingTelephone = true;
    this.http.put('/api/employes/mon-telephone', {
      telephone: this.nouveauTelephone.trim()
    }).subscribe({
      next: () => {
        this.isLoadingTelephone = false;
        this.succesTelephone    = 'Numéro de téléphone mis à jour avec succès.';
        this.telephoneActuel    = this.nouveauTelephone.trim();
        this.nouveauTelephone   = '';
        this.confirmationTelephone = '';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.showFormTelephone = false;
          this.succesTelephone   = '';
          this.cdr.detectChanges();
        }, 2000);
      },
      error: (err: any) => {
        this.isLoadingTelephone = false;
        this.erreurTelephone    = err?.error?.error ?? err?.error?.message ?? 'Erreur lors de la mise à jour. Veuillez réessayer.';
        this.cdr.detectChanges();
      }
    });
  }
}
