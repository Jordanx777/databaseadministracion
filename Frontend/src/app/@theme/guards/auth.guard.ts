import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  return authService.authReady$.pipe(
    take(1), // Solo necesitamos el primer valor resuelto
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true; //  Tiene sesión — dejar pasar
      }
      // ❌ No tiene sesión — redirigir al login
      return router.createUrlTree(['/auth/login']);
    })
  );
};