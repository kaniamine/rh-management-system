import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginModule {
  constructor(private router: Router) {}

  onLogin(): void {
    this.router.navigate(['/home-employee']);
  }
}