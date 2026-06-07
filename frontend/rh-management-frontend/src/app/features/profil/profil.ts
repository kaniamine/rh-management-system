import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.html',
  styleUrls: ['./profil.css']
})
export class Profil implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly cdr  = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);
  private readonly API  = '/api';

  telephone        = '';
  telephoneLoading = false;
  telephoneSuccess = '';
  telephoneError   = '';

  ancienMotDePasse  = '';
  nouveauMotDePasse = '';
  confirmMotDePasse = '';

  showAncien  = false;
  showNouveau = false;
  showConfirm = false;

  loading        = false;
  errorMessage   = '';
  successMessage = '';

  get session() { return this.auth.session; }

  ngOnInit(): void { this.loadTelephone(); }

  loadTelephone(): void {
    const m = this.session?.matricule;
    if (!m) return;
    this.http.get<any>(`${this.API}/employes/${m}`).subscribe({
      next: (d) => {
        this.telephone = d?.telephone ?? d?.Telephone ?? '';
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  updateTelephone(): void {
    const m = this.session?.matricule;
    if (!m) return;
    this.telephoneLoading = true;
    this.telephoneSuccess = '';
    this.telephoneError   = '';
    this.http.patch(`${this.API}/employes/${m}/telephone`, { telephone: this.telephone }).subscribe({
      next: () => {
        this.telephoneLoading = false;
        this.telephoneSuccess = 'Numéro mis à jour avec succès.';
        this.cdr.detectChanges();
        setTimeout(() => { this.telephoneSuccess = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err: any) => {
        this.telephoneLoading = false;
        this.telephoneError   = err?.error?.message ?? 'Erreur lors de la mise à jour.';
        this.cdr.detectChanges();
      }
    });
  }

  get initiales(): string {
    const stored = this.session?.initiales ?? '';
    if (stored) return stored;
    const parts = (this.session?.nomComplet ?? '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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

  get strength(): { score: number; label: string; color: string } {
    const p = this.nouveauMotDePasse;
    let score = 0;
    if (p.length >= 8)          score++;
    if (/[A-Z]/.test(p))        score++;
    if (/[a-z]/.test(p))        score++;
    if (/[0-9]/.test(p))        score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { score, label: 'Très faible', color: '#c60c30' };
    if (score === 2) return { score, label: 'Faible',      color: '#e05a00' };
    if (score === 3) return { score, label: 'Moyen',       color: '#f0a500' };
    if (score === 4) return { score, label: 'Fort',        color: '#0D776E' };
    return               { score, label: 'Très fort',     color: '#08564f' };
  }

  get passwordsMatch(): boolean {
    return !!this.nouveauMotDePasse && this.nouveauMotDePasse === this.confirmMotDePasse;
  }

  get canSubmit(): boolean {
    return !!this.ancienMotDePasse && this.strength.score >= 3 && this.passwordsMatch;
  }

  onSubmit(): void {
    this.errorMessage   = '';
    this.successMessage = '';

    if (!this.ancienMotDePasse) {
      this.errorMessage = 'Veuillez saisir votre mot de passe actuel.'; return;
    }
    if (this.strength.score < 3) {
      this.errorMessage = 'Le nouveau mot de passe est trop faible.'; return;
    }
    if (!this.passwordsMatch) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.'; return;
    }

    this.loading = true;
    this.auth.changePassword(this.ancienMotDePasse, this.nouveauMotDePasse, this.confirmMotDePasse).subscribe({
      next: () => {
        this.loading        = false;
        this.successMessage = 'Mot de passe modifié avec succès.';
        this.ancienMotDePasse  = '';
        this.nouveauMotDePasse = '';
        this.confirmMotDePasse = '';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading      = false;
        this.errorMessage = err?.error?.message ?? 'Mot de passe actuel incorrect.';
        this.cdr.detectChanges();
      }
    });
  }
}
