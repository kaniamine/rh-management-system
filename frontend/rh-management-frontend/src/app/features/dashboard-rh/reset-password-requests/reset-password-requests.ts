import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

const API = '/api/auth';

@Component({
  selector: 'app-reset-password-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password-requests.html',
  styleUrl: './reset-password-requests.css'
})
export class ResetPasswordRequests {
  private readonly http = inject(HttpClient);

  manualMatricule              = '';
  manualChecking               = false;
  manualExists: boolean | null = null;
  manualResetting              = false;
  manualDone                   = false;
  manualError                  = '';

  get manualLedState(): 'idle' | 'checking' | 'found' | 'not-found' {
    if (this.manualChecking)         return 'checking';
    if (this.manualExists === true)  return 'found';
    if (this.manualExists === false) return 'not-found';
    return 'idle';
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
}
