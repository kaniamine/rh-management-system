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

const POINTAGE_EXCLUDED_ROLES = ['rh', 'admin'];
const POINTAGE_API = '/api/pointage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API        = '/api/auth';
  private _session: UserSession | null = null;
  private readonly isBrowser  = isPlatformBrowser(inject(PLATFORM_ID));

  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private inactivityTimer:   ReturnType<typeof setTimeout>  | null = null;
  private readonly _inactivityHandler = () => this._resetInactivity();

  constructor(private http: HttpClient, private router: Router) {
    if (this.isBrowser) {
      const saved = sessionStorage.getItem('user_session');
      if (saved) {
        this._session = JSON.parse(saved);
        if (this._session && !POINTAGE_EXCLUDED_ROLES.includes(this._session.role)) {
          this.demarrerHeartbeat();
        }
      }
    }
  }

  get session(): UserSession | null { return this._session; }
  get token(): string | null        { return this._session?.token ?? null; }
  get isLoggedIn(): boolean          { return !!this._session; }
  get role(): string                 { return this._session?.role ?? ''; }

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
          direction:                      raw.direction ?? '',
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

        // Auto check-in for non-rh/admin roles
        if (!POINTAGE_EXCLUDED_ROLES.includes(user.role)) {
          this.http.post(`${POINTAGE_API}/entree`, {}).subscribe({
            next: () => console.log('Entrée enregistrée'),
            error: err => console.error('Erreur pointage entrée:', err)
          });
          this.demarrerHeartbeat();
        }
      })
    );
  }

  logout(): void {
    const role = this._session?.role;
    this.arreterHeartbeat();

    if (role && !POINTAGE_EXCLUDED_ROLES.includes(role)) {
      this.http.post(`${POINTAGE_API}/sortie`, {}).subscribe({
        next:  () => this._clearSession(),
        error: () => this._clearSession()
      });
    } else {
      this._clearSession();
    }
  }

  private _clearSession(): void {
    this._session = null;
    if (this.isBrowser) {
      sessionStorage.removeItem('user_session');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('adminToken');
    }
    this.router.navigate(['/login']);
  }

  // ── Heartbeat + inactivity ───────────────────────────────────────────────────

  demarrerHeartbeat(): void {
    if (!this.isBrowser) return;
    this.arreterHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this._session?.token && !POINTAGE_EXCLUDED_ROLES.includes(this._session.role)) {
        this.http.post(`${POINTAGE_API}/heartbeat`, {}).subscribe();
      }
    }, 5 * 60 * 1000);

    document.addEventListener('mousemove', this._inactivityHandler);
    document.addEventListener('keypress',  this._inactivityHandler);
    document.addEventListener('click',     this._inactivityHandler);
    this._resetInactivity();
  }

  arreterHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.isBrowser) {
      document.removeEventListener('mousemove', this._inactivityHandler);
      document.removeEventListener('keypress',  this._inactivityHandler);
      document.removeEventListener('click',     this._inactivityHandler);
    }
  }

  private _resetInactivity(): void {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => this.logout(), 30 * 60 * 1000);
  }

  // ── Misc helpers ─────────────────────────────────────────────────────────────

  changePassword(
    ancienMotDePasse: string,
    nouveauMotDePasse: string,
    confirmationMotDePasse: string
  ) {
    return this.http.post(
      '/api/auth/change-password',
      {
        ancienMotDePasse,
        nouveau_mot_de_passe:      nouveauMotDePasse,
        confirmation_mot_de_passe: confirmationMotDePasse
      }
    );
  }

  markPasswordChanged(): void {
    if (this._session) {
      this._session = { ...this._session, premiereConnexion: false };
      if (this.isBrowser) {
        sessionStorage.setItem('user_session', JSON.stringify(this._session));
      }
    }
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

  getToken(): string {
    return this._session?.token ?? '';
  }
}
