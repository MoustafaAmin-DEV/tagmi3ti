import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const messageService = inject(MessageService);
  const translate = inject(TranslateService);

  await auth.whenReady;

  if (auth.isLoggedIn) {
    return true;
  }

  auth.requestLogin(state.url);
  messageService.add({
    severity: 'info',
    summary: translate.instant('auth.loginRequired'),
    detail: translate.instant('auth.loginRequiredDetail'),
    life: 6000,
  });
  return router.createUrlTree(['/']);
};
