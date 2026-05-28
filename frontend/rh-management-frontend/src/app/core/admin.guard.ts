import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

export const adminGuard = () => {
  const router     = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isAdmin    = isPlatformBrowser(platformId) && localStorage.getItem('isAdmin') === 'true';
  if (!isAdmin) {
    router.navigate(['/rh/acces-admin']);
    return false;
  }
  return true;
};
