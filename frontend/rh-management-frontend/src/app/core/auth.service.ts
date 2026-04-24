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
  premiereConnexion: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = '/api/auth';
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

  private computeInitiales(nomComplet: string): string {
    const parts = (nomComplet ?? '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  login(matricule: string, password: string) {
    return this.http.post<any>(`${this.API}/login`, { matricule, password }).pipe(
      tap(raw => {
        const nomComplet = raw.nomComplet ?? raw.nom_complet ?? raw.nomcomplet ?? '';
        const user: UserSession = {
          matricule:                      raw.matricule ?? '',
          role:                           raw.role ?? 'employe',
          nomComplet,
          initiales:                      raw.initiales ?? this.computeInitiales(nomComplet),
          direction:                      raw.direction ?? raw.direction ?? '',
          service:                        raw.service ?? '',
          fonction:                       raw.fonction ?? raw.poste ?? '',
          soldeConges:                    raw.soldeConges ?? raw.solde_conges ?? 0,
          superieurHierarchiqueMatricule: raw.superieurHierarchiqueMatricule ?? raw.superieur_hierarchique_matricule,
          token:                          raw.token ?? raw.accessToken ?? raw.access_token ?? '',
          expiresAt:                      raw.expiresAt ?? raw.expires_at ?? '',
          premiereConnexion:              raw.mustChangePassword ?? raw.premiereConnexion ?? raw.premiere_connexion ?? false
        };
        this._session = user;
        if (this.isBrowser) {
          sessionStorage.setItem('user_session', JSON.stringify(user));
        }
      })
    );
  }

  changePassword(ancienMotDePasse: string, nouveauMotDePasse: string, _confirmationMotDePasse: string) {
    return this.http.post(`${this.API}/change-password`, {
      currentPassword: ancienMotDePasse,
      newPassword:     nouveauMotDePasse
    });
  }

  markPasswordChanged(): void {
    if (this._session) {
      this._session = { ...this._session, premiereConnexion: false };
      if (this.isBrowser) {
        sessionStorage.setItem('user_session', JSON.stringify(this._session));
      }
    }
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
