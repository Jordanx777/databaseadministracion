import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './demo/layout/admin';
import { EmptyComponent } from './demo/layout/empty';
import { ProfileComponent } from './demo/pages/profile/profile';

//  Guard de autenticación
import { authGuard } from 'src/app/@theme/guards/auth.guard';

const routes: Routes = [

  //  LANDING PRINCIPAL - pública
  {
    path: '',
    loadComponent: () =>
      import('./demo/pages/landing/pagina-principal-component/pagina-principal-component')
        .then(m => m.PaginaPrincipalComponent),
    pathMatch: 'full'
  },

  //  RUTAS PROTEGIDAS - requieren autenticación
  {
    path: '',
    component: AdminComponent,
    canActivate: [authGuard], //  Protege todo el layout admin y sus hijos
    children: [
      {
        path: 'profile',
        component: ProfileComponent
      },
      // {
      //   path: 'dashboard',
      //   loadComponent: () => import('./demo/pages/dashboard/dashboard.component')
      // },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./demo/pages/estadisticas/estadisticas').then((m) => m.DashboardComponent)
      },
      {
        path: 'component',
        loadChildren: () =>
          import('./demo/pages/components/component.module').then((m) => m.ComponentModule)
      },
      {
        path: 'sample-page',
        loadComponent: () => import('./demo/pages/other/sample-page/sample-page.component')
      }
    ]
  },

  //  RUTAS PÚBLICAS - login, register
  {
    path: '',
    component: EmptyComponent,
    children: [
      {
        path: 'auth',
        loadChildren: () => import('./demo/pages/auth/auth.module').then((m) => m.AuthModule)
      }
    ]
  },

  // 
  {
      path: 'forgot-password',
      loadComponent: () =>
        import('./demo/pages/forgot-password/forgot-password.component')
          .then(m => m.ForgotPasswordComponent),
    },
    {
      path: 'reset-password',
      loadComponent: () =>
        import('./demo/pages/reset-password/reset-password.component')
          .then(m => m.ResetPasswordComponent),
    },

  //  Ruta comodín - redirigir a landing
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}