import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export interface UserSession {
  matricule: string;
  role: 'employe' | 'n1' | 'dg' | 'rh' | 'admin';
  nomComplet: string;
  initiales: string;
  direction: string;
  service: string;
  fonction: string;
  soldeConges: number;
  superieurHierarchiqueMatricule?: string;
  token: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'http://localhost:5130/api/auth';
  private _session: UserSession | null = null;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(private http: HttpClient, private router: Router) {
    if (this.isBrowser) {
      const saved = sessionStorage.getItem('user_session');
      if (saved) this._session = JSON.parse(saved);
    }
  }

  get session(): UserSession | null { return this._session; }
  get token(): string | null { return this._session?.token ?? null; }
  get isLoggedIn(): boolean { return !!this._session; }
  get role(): string { return this._session?.role ?? ''; }

  login(matricule: string, password: string) {
    return this.http.post<UserSession>(`${this.API}/login`, { matricule, password }).pipe(
      tap(user => {
        this._session = user;
        if (this.isBrowser) {
          sessionStorage.setItem('user_session', JSON.stringify(user));
        }
      })
    );
  }

  logout(): void {
    this._session = null;
    if (this.isBrowser) {
      sessionStorage.removeItem('user_session');
    }
    this.router.navigate(['/login']);
  }

  getHomeRoute(): string {
    const map: Record<string, string> = {
      employe: '/home-employee',
      n1:      '/responsable',
      dg:      '/dg',
      rh:      '/home-rh',
      admin:   '/home-rh'
    };
    return map[this._session?.role ?? ''] ?? '/login';
  }
}
