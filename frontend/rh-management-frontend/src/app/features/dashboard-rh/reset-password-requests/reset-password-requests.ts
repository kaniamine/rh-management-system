import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/notification.service';

const API = 'http://localhost:5130';

interface ResetRequest {
  notifId:   number;
  matricule: string;
  timestamp: string;
  isRead:    boolean;
  checking:  boolean;
  exists:    boolean | null;
  resetting: boolean;
  done:      boolean;
}

@Component({
  selector: 'app-reset-password-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password-requests.html',
  styleUrl: './reset-password-requests.css'
})
export class ResetPasswordRequests implements OnInit {
  private readonly http   = inject(HttpClient);
  private readonly notifs = inject(NotificationService);

  requests: ResetRequest[] = [];
  loading = true;

  manualMatricule              = '';
  manualChecking               = false;
  manualExists: boolean | null = null;
  manualResetting              = false;
  manualDone                   = false;
  manualError                  = '';

  // ── Shims for the unchanged manual-section HTML ──────────────
  get loadingRequests(): boolean {
    return this.loading;
  }

  get manualLedState(): 'idle' | 'checking' | 'found' | 'not-found' {
    if (this.manualChecking)         return 'checking';
    if (this.manualExists === true)  return 'found';
    if (this.manualExists === false) return 'not-found';
    return 'idle';
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading  = true;
    this.requests = [];

    this.http
      .get<any[]>(`${API}/api/notifications/reset-password-requests`)
      .subscribe({
        next: (notifs) => {
          this.requests = notifs.map(n => ({
            notifId:   n.id        ?? n.Id        ?? 0,
            matricule: (n.matricule ?? n.Matricule ?? '???').toString().toUpperCase(),
            timestamp: n.timestamp  ?? n.Timestamp  ?? '',
            isRead:    n.isRead     ?? n.IsRead     ?? false,
            checking:  false,
            exists:    null,
            resetting: false,
            done:      n.isRead ?? n.IsRead ?? false
          }));

          // Check each matricule against the database immediately
          this.requests.forEach(r => this.checkMatricule(r));
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  refresh(): void {
    this.requests = [];
    this.loadRequests();
  }

  checkMatricule(req: ResetRequest): void {
    if (!req.matricule || req.matricule === '???') {
      req.exists   = false;
      req.checking = false;
      return;
    }

    req.checking = true;
    req.exists   = null;

    this.http
      .get<any>(`${API}/api/auth/check-matricule?matricule=${encodeURIComponent(req.matricule)}`)
      .subscribe({
        next: (res) => {
          // Handle both camelCase and PascalCase response
          req.exists   = res.exists ?? res.Exists ?? false;
          req.checking = false;
        },
        error: () => {
          req.exists   = false;
          req.checking = false;
        }
      });
  }

  resetPassword(req: ResetRequest): void {
    if (req.resetting || req.done) return;
    req.resetting = true;

    this.http
      .post<any>(`${API}/api/auth/reset-password`, { matricule: req.matricule })
      .subscribe({
        next: () => {
          req.resetting = false;
          req.done      = true;
          this.notifs.load();
        },
        error: () => {
          req.resetting = false;
        }
      });
  }

  // Alias kept for the unchanged manual-section HTML
  checkManual(): void {
    this.onManualCheck();
  }

  onManualCheck(): void {
    const mat = this.manualMatricule.trim().toUpperCase();
    if (!mat) return;

    this.manualChecking = true;
    this.manualExists   = null;
    this.manualDone     = false;
    this.manualError    = '';

    this.http
      .get<any>(`${API}/api/auth/check-matricule?matricule=${encodeURIComponent(mat)}`)
      .subscribe({
        next: (res) => {
          this.manualExists   = res.exists ?? res.Exists ?? false;
          this.manualChecking = false;
        },
        error: () => {
          this.manualExists   = false;
          this.manualChecking = false;
        }
      });
  }

  // Alias kept for the unchanged manual-section HTML
  resetManual(): void {
    this.onManualReset();
  }

  onManualReset(): void {
    if (!this.manualExists) return;
    const mat = this.manualMatricule.trim().toUpperCase();
    this.manualResetting = true;
    this.manualError     = '';

    this.http
      .post<any>(`${API}/api/auth/reset-password`, { matricule: mat })
      .subscribe({
        next: () => {
          this.manualResetting = false;
          this.manualDone      = true;
          this.notifs.load();
        },
        error: () => {
          this.manualResetting = false;
          this.manualError = 'Erreur lors de la réinitialisation.';
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
