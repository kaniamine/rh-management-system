import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Notification {
  id: number;
  destinataireMatricule: string;
  destinataireRole?: string;
  typeDemande?: string;
  demandeId?: number;
  action?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly API  = 'http://localhost:5130/api/notifications';
  private _notifs = new BehaviorSubject<Notification[]>([]);
  notifs$ = this._notifs.asObservable();

  get unreadCount(): number {
    return this._notifs.value.filter(n => !n.isRead).length;
  }

  get all(): Notification[] {
    return this._notifs.value;
  }

  load(): void {
    const matricule = this.auth.session?.matricule;
    if (!matricule) return;
    // FIX: query param au lieu de path segment
    this.http.get<Notification[]>(`${this.API}?matricule=${encodeURIComponent(matricule)}`).subscribe({
      next: (data) => this._notifs.next(data),
      error: () => {}
    });
  }

  startPolling(): void {
    const matricule = this.auth.session?.matricule;
    if (!matricule) return;
    // FIX: query param au lieu de path segment
    interval(30000).pipe(
      switchMap(() => this.http.get<Notification[]>(`${this.API}?matricule=${encodeURIComponent(matricule)}`))
    ).subscribe({
      next: (data) => this._notifs.next(data),
      error: () => {}
    });
  }

  markAsRead(id: number): void {
    // FIX: POST /{id}/lire au lieu de PATCH /{id}/read
    this.http.post(`${this.API}/${id}/lire`, {}).subscribe({
      next: () => {
        const updated = this._notifs.value.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        );
        this._notifs.next(updated);
      },
      error: () => {}
    });
  }

  markAllAsRead(): void {
    const matricule = this.auth.session?.matricule;
    if (!matricule) return;
    // Utilise l'endpoint bulk plutôt que des appels individuels
    this.http.post(`${this.API}/lire-toutes?matricule=${encodeURIComponent(matricule)}`, {}).subscribe({
      next: () => {
        const updated = this._notifs.value.map(n => ({ ...n, isRead: true }));
        this._notifs.next(updated);
      },
      error: () => {}
    });
  }

  // Lien de navigation vers la demande concernée
  getLienDemande(notif: Notification): string | null {
    if (!notif.typeDemande || !notif.demandeId) return null;
    const routes: Record<string, string> = {
      conge:        '/dashboard-employee',
      autorisation: '/dashboard-employee',
      maladie:      '/dashboard-employee'
    };
    return routes[notif.typeDemande] ?? null;
  }
}
