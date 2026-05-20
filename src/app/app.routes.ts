import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/page-layout/page-layout.component').then(
        (m) => m.PageLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
        data: { layout: 'full' },
      },
      {
        path: 'checker',
        loadComponent: () =>
          import('./pages/compatibility-checker/compatibility-checker.component').then(
            (m) => m.CompatibilityCheckerComponent,
          ),
      },
      {
        path: 'budget',
        loadComponent: () =>
          import('./pages/budget-builder/budget-builder.component').then(
            (m) => m.BudgetBuilderComponent,
          ),
      },
      {
        path: 'ai',
        loadComponent: () =>
          import('./pages/ai-suggester/ai-suggester.component').then((m) => m.AiSuggesterComponent),
      },
      {
        path: 'saved',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/saved-builds/saved-builds.component').then((m) => m.SavedBuildsComponent),
      },
      {
        path: 'compare',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/compare-builds/compare-builds.component').then(
            (m) => m.CompareBuildsComponent,
          ),
      },
      {
        path: 'store',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/store-dashboard/store-dashboard.component').then(
            (m) => m.StoreDashboardComponent,
          ),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'b/:slug',
        loadComponent: () =>
          import('./pages/shared-build/shared-build.component').then((m) => m.SharedBuildComponent),
      },
      {
        path: 'about',
        loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('./pages/privacy/privacy.component').then((m) => m.PrivacyComponent),
      },
      {
        path: '**',
        loadComponent: () =>
          import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
