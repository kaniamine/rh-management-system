import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Notification {
  id: number;
  destinataireMatricule: string;
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
    this.http.get<Notification[]>(`${this.API}/${matricule}`).subscribe({
      next: (data) => this._notifs.next(data),
      error: () => {}
    });
  }

  startPolling(): void {
    const matricule = this.auth.session?.matricule;
    if (!matricule) return;
    interval(30000).pipe(
      switchMap(() => this.http.get<Notification[]>(`${this.API}/${matricule}`))
    ).subscribe({
      next: (data) => this._notifs.next(data),
      error: () => {}
    });
  }

  markAsRead(id: number): void {
    this.http.patch(`${this.API}/${id}/read`, {}).subscribe({
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
    this._notifs.value.filter(n => !n.isRead).forEach(n => this.markAsRead(n.id));
  }
}
