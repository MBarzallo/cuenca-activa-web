import { Routes } from '@angular/router';
import { ADMIN_ROLES } from './core/models/auth-user.model';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/home/home-page.component').then((m) => m.HomePageComponent),
      },
      {
        path: 'mapa',
        loadComponent: () => import('./features/public/mapa/public-map-page.component').then((m) => m.PublicMapPageComponent),
      },
      {
        path: 'incidencias',
        loadComponent: () =>
          import('./features/public/incidencias/public-incidencias-page.component').then(
            (m) => m.PublicIncidenciasPageComponent,
          ),
      },
      {
        path: 'reportar',
        canMatch: [authGuard],
        loadComponent: () =>
          import('./features/citizen/report-incident/report-incident-page.component').then(
            (m) => m.ReportIncidentPageComponent,
          ),
      },
      {
        path: 'incidencias/:id',
        loadComponent: () =>
          import('./features/public/incidencia-detail/incidencia-detail-page.component').then(
            (m) => m.IncidenciaDetailPageComponent,
          ),
      },
      {
        path: 'perfil',
        canMatch: [authGuard],
        loadComponent: () => import('./features/citizen/profile/profile-page.component').then((m) => m.ProfilePageComponent),
      },
      {
        path: 'notificaciones',
        canMatch: [authGuard],
        loadComponent: () =>
          import('./features/citizen/notifications/notifications-page.component').then(
            (m) => m.NotificationsPageComponent,
          ),
      },
      {
        path: 'mis-reportes',
        canMatch: [authGuard],
        loadComponent: () => import('./features/citizen/my-reports/my-reports-page.component').then((m) => m.MyReportsPageComponent),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login-page.component').then((m) => m.LoginPageComponent),
      },
      {
        path: 'registro',
        loadComponent: () => import('./features/auth/register/register-page.component').then((m) => m.RegisterPageComponent),
      },
      {
        path: 'completar-perfil',
        loadComponent: () =>
          import('./features/auth/complete-profile/complete-profile-page.component').then(
            (m) => m.CompleteProfilePageComponent,
          ),
      },
      {
        path: 'recuperar-contrasena',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password-page.component').then(
            (m) => m.ForgotPasswordPageComponent,
          ),
      },
    ],
  },
  {
    path: 'admin',
    canMatch: [authGuard, roleGuard],
    data: { roles: ADMIN_ROLES },
    loadComponent: () => import('./core/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/admin-dashboard-page.component').then((m) => m.AdminDashboardPageComponent),
      },
      {
        path: 'incidencias',
        loadComponent: () => import('./features/incidencias/admin-incidencias-page.component').then((m) => m.AdminIncidenciasPageComponent),
      },
      {
        path: 'reportes-contenido',
        loadComponent: () =>
          import('./features/reportes-contenido/reportes-contenido-page.component').then(
            (m) => m.ReportesContenidoPageComponent,
          ),
      },
      {
        path: 'moderacion',
        loadComponent: () =>
          import('./features/moderacion/imagen-moderacion-page.component').then(
            (m) => m.ImagenModeracionPageComponent,
          ),
      },
      {
        path: 'auditoria',
        loadComponent: () => import('./features/auditoria/auditoria-page.component').then((m) => m.AuditoriaPageComponent),
      },
      {
        path: 'catalogos',
        loadComponent: () => import('./features/catalogos/catalogos-page.component').then((m) => m.CatalogosPageComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/usuarios/usuarios-page.component').then((m) => m.UsuariosPageComponent),
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./features/notificaciones/admin-notificaciones-page.component').then(
            (m) => m.AdminNotificacionesPageComponent,
          ),
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./features/configuracion/configuracion-page.component').then((m) => m.ConfiguracionPageComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
