import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { AuthSessionService } from '../auth/auth-session.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, ToastModule, ConfirmDialogModule],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="min-h-[100dvh] bg-[var(--ca-bg)] text-[var(--ca-navy)] lg:grid lg:grid-cols-[292px_1fr]">
      <aside class="sticky top-0 z-40 flex h-auto flex-col border-r border-white/10 bg-[var(--ca-navy)] text-white lg:h-[100dvh]">
        <div class="px-5 pb-4 pt-5">
          <a routerLink="/admin" class="flex items-center gap-3 rounded-[var(--ca-radius-lg)] bg-white/5 p-3 ring-1 ring-white/10 transition hover:bg-white/10">
            <img src="/logo/icon_only_white.png" class="h-12 w-12 object-contain" alt="CA Logo" />
            <span>
              <span class="block text-base font-semibold leading-5">CuencaActiva</span>
              <span class="text-xs font-medium text-slate-300">Gestión municipal</span>
            </span>
          </a>
        </div>

        <nav class="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:flex-1 lg:space-y-1 lg:overflow-visible">
          <a routerLink="/admin" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="ca-admin-active" class="ca-admin-link">
            <i class="pi pi-chart-line"></i><span>Dashboard</span>
          </a>
          <a routerLink="/admin/incidencias" routerLinkActive="ca-admin-active" class="ca-admin-link">
            <i class="pi pi-map-marker"></i><span>Incidencias</span>
          </a>
          <a routerLink="/admin/reportes-contenido" routerLinkActive="ca-admin-active" class="ca-admin-link">
            <i class="pi pi-flag"></i><span>Reportes de contenido</span>
          </a>
          <a routerLink="/admin/moderacion" routerLinkActive="ca-admin-active" class="ca-admin-link">
            <i class="pi pi-images"></i><span>Moderación</span>
          </a>
          <a routerLink="/admin/usuarios" routerLinkActive="ca-admin-active" class="ca-admin-link">
            <i class="pi pi-users"></i><span>Usuarios</span>
          </a>
          <a routerLink="/admin/catalogos" routerLinkActive="ca-admin-active" class="ca-admin-link">
            <i class="pi pi-list-check"></i><span>Catálogos</span>
          </a>
          <a routerLink="/admin/auditoria" routerLinkActive="ca-admin-active" class="ca-admin-link">
            <i class="pi pi-shield"></i><span>Auditoría</span>
          </a>
          <a routerLink="/admin/configuracion" routerLinkActive="ca-admin-active" class="ca-admin-link">
            <i class="pi pi-cog"></i><span>Configuración</span>
          </a>
        </nav>

        <div class="hidden px-4 pb-5 lg:block">
          <div class="rounded-[var(--ca-radius-lg)] border border-white/10 bg-white/[0.06] p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-gold)]">Sesión activa</p>
            <p class="mt-2 truncate text-sm font-semibold">{{ userLabel() }}</p>
            <p class="mt-1 text-xs text-slate-300">{{ rolesLabel() }}</p>
          </div>
        </div>
      </aside>

      <main class="min-w-0">
        <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ca-teal)]">Panel interno</p>
              <h1 class="truncate text-xl font-semibold">Administración de incidencias ciudadanas</h1>
            </div>
            <div class="flex items-center gap-2">
              <a routerLink="/incidencias" pButton severity="secondary" outlined icon="pi pi-globe" label="Web pública"></a>
              <button pButton severity="secondary" outlined icon="pi pi-sign-out" label="Salir" (click)="logout()"></button>
            </div>
          </div>
        </header>

        <section class="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
          <router-outlet />
        </section>
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  readonly userLabel = computed(() => {
    const user = this.session.user();
    return user?.aliasPublico || user?.email || 'Usuario';
  });
  readonly rolesLabel = computed(() => this.session.user()?.roles?.join(', ') || 'Sin roles');

  async logout() {
    await this.session.logout();
    await this.router.navigateByUrl('/login');
  }
}
