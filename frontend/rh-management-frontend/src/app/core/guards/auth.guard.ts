import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }

<<<<<<< HEAD
=======
  // Allow entry even if premiereConnexion = true
  // The navbar will show the forced change password modal on top
>>>>>>> dd707c7423a8a8f0531d4584df3b2a511580008b
  return true;
};
