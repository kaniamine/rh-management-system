import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserSession } from '../../../../core/auth.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.html',
  styleUrl: './profil.css'
})
export class Profil implements OnInit {
  private readonly auth = inject(AuthService);

  user: UserSession | null = null;

  motDePasseActuel      = '';
  nouveauMotDePasse     = '';
  confirmationMotDePasse = '';

  showActuel       = false;
  showNouveau      = false;
  showConfirmation = false;

  successMessage = '';
  errorMessage   = '';
  loading        = false;

  ngOnInit(): void {
    this.user = this.auth.session;
  }

  get strength(): { score: number; label: string; color: string } {
    const p = this.nouveauMotDePasse;
    let score = 0;
    if (p.length >= 8)           score++;
    if (/[A-Z]/.test(p))         score++;
    if (/[a-z]/.test(p))         score++;
    if (/[0-9]/.test(p))         score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { score, label: 'Très faible', color: '#c60c30' };
    if (score === 2) return { score, label: 'Faible',      color: '#e05a00' };
    if (score === 3) return { score, label: 'Moyen',       color: '#f0a500' };
    if (score === 4) return { score, label: 'Fort',        color: '#0D776E' };
    return               { score, label: 'Très fort',     color: '#08564f' };
  }

  get passwordsMatch(): boolean {
    return !!this.nouveauMotDePasse && this.nouveauMotDePasse === this.confirmationMotDePasse;
  }

  get canSubmit(): boolean {
    return (
      !!this.motDePasseActuel &&
      this.strength.score >= 5 &&
      this.passwordsMatch &&
      this.nouveauMotDePasse !== this.motDePasseActuel
    );
  }

  onChangerMotDePasse(): void {
    this.successMessage = '';
    this.errorMessage   = '';

    if (!this.motDePasseActuel || !this.nouveauMotDePasse || !this.confirmationMotDePasse) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }
    if (!this.passwordsMatch) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (this.strength.score < 5) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.';
      return;
    }
    if (this.nouveauMotDePasse === this.motDePasseActuel) {
      this.errorMessage = 'Le nouveau mot de passe doit être différent de l\'ancien.';
      return;
    }

    this.loading = true;
    this.auth.changePassword(
      this.user!.matricule,
      this.motDePasseActuel,
      this.nouveauMotDePasse
    ).subscribe({
      next: () => {
        this.loading       = false;
        this.successMessage = 'Mot de passe modifié avec succès.';
        this.errorMessage  = '';
        this.motDePasseActuel       = '';
        this.nouveauMotDePasse      = '';
        this.confirmationMotDePasse = '';
      },
      error: (err: any) => {
        this.loading       = false;
        this.errorMessage  = err?.error?.message ?? 'Mot de passe actuel incorrect.';
        this.successMessage = '';
      }
    });
  }

  get initiales(): string {
    const stored = this.user?.initiales ?? '';
    if (stored) return stored;
    const parts = (this.user?.nomComplet ?? '').trim().split(/\s+/).filter(Boolean);
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
      admin:   'Administrateur'
    };
    return map[this.user?.role ?? ''] ?? this.user?.role ?? '';
  }
}
