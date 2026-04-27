import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password-modal.html',
  styleUrls: ['./forgot-password-modal.css']
})
export class ForgotPasswordModal {
  @Output() closed = new EventEmitter<void>();

  private readonly http = inject(HttpClient);
  private readonly API  = '/api/auth';

  matricule      = '';
  loading        = false;
  errorMessage   = '';
  successMessage = '';

  onSubmit(): void {
    this.errorMessage   = '';
    this.successMessage = '';

    if (!this.matricule.trim()) {
      this.errorMessage = 'Veuillez saisir votre matricule.';
      return;
    }

    this.loading = true;
    this.http.post(`${this.API}/forgot-password`, { matricule: this.matricule.trim() }).subscribe({
      next: () => {
        this.loading        = false;
        this.successMessage = 'Demande transmise à la RH.';
      },
      error: (err: any) => {
        this.loading      = false;
        this.errorMessage = err?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}
