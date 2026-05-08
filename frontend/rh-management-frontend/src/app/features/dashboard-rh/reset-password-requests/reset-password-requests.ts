import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

const API = 'http://localhost:5130/api/auth';

@Component({
  selector: 'app-reset-password-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password-requests.html',
  styleUrl: './reset-password-requests.css'
})
export class ResetPasswordRequests implements OnInit {
  private readonly http = inject(HttpClient);

  demandes: any[] = [];
  loading         = true;

  smsLoading = false;
  smsSuccess = '';
  smsError   = '';

  manualMatricule              = '';
  manualChecking               = false;
  manualExists: boolean | null = null;
  manualResetting              = false;
  manualDone                   = false;
  manualError                  = '';

  get loadingRequests(): boolean { return this.loading; }

  get manualLedState(): 'idle' | 'checking' | 'found' | 'not-found' {
    if (this.manualChecking)         return 'checking';
    if (this.manualExists === true)  return 'found';
    if (this.manualExists === false) return 'not-found';
    return 'idle';
  }

  ngOnInit(): void { this.loadDemandes(); }

  loadDemandes(): void {
    this.loading  = true;
    this.demandes = [];
    this.smsSuccess = '';
    this.smsError   = '';
    this.http.get<any[]>(`${API}/demandes-reinitialisation`).subscribe({
      next:  (data) => { this.demandes = data; this.loading = false; },
      error: ()     => { this.loading = false; }
    });
  }

  refresh(): void { this.loadDemandes(); }

  reinitialiserMotDePasse(demandeId: number): void {
    this.smsError   = '';
    this.smsSuccess = '';
    this.smsLoading = true;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const mdp   = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');

    this.http
      .post<any>(`${API}/reinitialiser-mot-de-passe`, { demandeId, nouveauMotDePasse: mdp })
      .subscribe({
        next: () => {
          this.smsSuccess = 'SMS envoyé — mot de passe réinitialisé avec succès.';
          this.demandes   = this.demandes.filter((d: any) => d.id !== demandeId);
          this.smsLoading = false;
        },
        error: (err: any) => {
          this.smsError   =
            err?.error?.message ??
            err?.error?.Message ??
            err?.message ??
            'Erreur lors de la réinitialisation.';
          this.smsLoading = false;
        }
      });
  }

  checkManual(): void { this.onManualCheck(); }
  resetManual(): void { this.onManualReset(); }

  onManualCheck(): void {
    const mat = this.manualMatricule.trim().toUpperCase();
    if (!mat) return;
    this.manualChecking = true;
    this.manualExists   = null;
    this.manualDone     = false;
    this.manualError    = '';
    this.http
      .get<any>(`${API}/check-matricule?matricule=${encodeURIComponent(mat)}`)
      .subscribe({
        next:  (res) => { this.manualExists = res.exists ?? res.Exists ?? false; this.manualChecking = false; },
        error: ()    => { this.manualExists = false; this.manualChecking = false; }
      });
  }

  onManualReset(): void {
    if (!this.manualExists) return;
    const mat = this.manualMatricule.trim().toUpperCase();
    this.manualResetting = true;
    this.manualError     = '';
    this.http
      .post<any>(`${API}/reset-password`, { matricule: mat })
      .subscribe({
        next: () => {
          this.manualResetting = false;
          this.manualDone      = true;
        },
        error: (err: any) => {
          this.manualResetting = false;
          this.manualError =
            err?.error?.message ??
            err?.error?.Message ??
            err?.message ??
            'Erreur lors de la réinitialisation.';
        }
      });
  }

  formatDate(ts: string): string {
    if (!ts) return '';
    return new Date(ts).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
