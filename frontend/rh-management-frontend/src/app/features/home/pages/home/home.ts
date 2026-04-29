import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private readonly auth = inject(AuthService);

  get initiales(): string {
    const stored = this.auth.session?.initiales ?? '';
    if (stored) return stored;
    const parts = (this.auth.session?.nomComplet ?? '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  get prenom(): string {
    const nom = this.auth.session?.nomComplet ?? '';
    return nom.trim().split(/\s+/)[0] ?? '';
  }
}