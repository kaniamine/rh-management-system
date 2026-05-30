import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector:    'app-creer-compte-rh',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './creer-compte-rh.html'
})
export class CreerCompteRh implements OnInit {
  private readonly http       = inject(HttpClient);
  private readonly router     = inject(Router);
  private readonly auth       = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  form = {
    matricule: '',
    nom:       '',
    prenom:    '',
    email:     '',
    telephone: '',
    motDePasse: '',
    direction: 'Direction des Ressources Humaines',
    service:   '',
    fonction:  ''
  };

  erreur    = '';
  succes    = '';
  isLoading = false;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && localStorage.getItem('isAdmin') !== 'true') {
      this.router.navigate(['/dashboard-rh']);
    }
  }

  creerCompte(): void {
    if (!this.form.matricule || !this.form.nom || !this.form.prenom || !this.form.motDePasse) {
      this.erreur = 'Les champs matricule, nom, prénom et mot de passe sont obligatoires.';
      return;
    }
    this.isLoading = true;
    this.erreur    = '';
    this.succes    = '';

    this.http.post('/api/utilisateurs/creer-rh', { ...this.form, role: 'rh' }).subscribe({
      next: () => {
        this.isLoading = false;
        this.succes    = `Le compte RH pour ${this.form.prenom} ${this.form.nom} (${this.form.matricule}) a été créé avec succès.`;
        this.form = {
          matricule: '', nom: '', prenom: '',
          email: '', telephone: '', motDePasse: '',
          direction: 'Direction des Ressources Humaines',
          service: '', fonction: ''
        };
      },
      error: err => {
        this.isLoading = false;
        this.erreur    = err?.error?.error ?? 'Erreur lors de la création du compte.';
      }
    });
  }
}
