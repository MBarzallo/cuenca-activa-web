import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { AuthSessionService } from '../auth/auth-session.service';
import { NotificationsService } from '../services/notifications.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, ToastModule],
  template: `
    <p-toast></p-toast>
    <div class="min-h-screen bg-[var(--ca-bg)] text-[var(--ca-navy)] lg:grid lg:grid-cols-[268px_1fr]">
      <aside class="sticky top-0 z-30 hidden h-screen flex-col border-r border-slate-200 bg-white px-4 py-5 shadow-sm lg:flex">
        <a routerLink="/" class="mb-6 flex items-center gap-3 rounded-2xl bg-[var(--ca-navy)] p-3 text-white">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-[var(--ca-gold)] font-black text-[var(--ca-navy)]">CA</span>
          <span>
            <span class="block font-semibold leading-5">CuencaActiva</span>
            <span class="text-xs text-slate-300">Ciudadanía en acción</span>
          </span>
        </a>

        <nav class="space-y-1">
          <a routerLink="/" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="ca-public-active" class="ca-public-link">
            <i class="pi pi-home"></i><span>Inicio</span>
          </a>
          <a routerLink="/mapa" routerLinkActive="ca-public-active" class="ca-public-link">
            <i class="pi pi-map"></i><span>Mapa ciudadano</span>
          </a>
          <a routerLink="/incidencias" routerLinkActive="ca-public-active" class="ca-public-link">
            <i class="pi pi-list"></i><span>Incidencias</span>
          </a>

          @if (isLoggedIn()) {
            <a routerLink="/reportar" routerLinkActive="ca-public-active" class="ca-public-link">
              <i class="pi pi-plus-circle"></i><span>Reportar</span>
            </a>
            <a routerLink="/perfil" routerLinkActive="ca-public-active" class="ca-public-link">
              <i class="pi pi-user"></i><span>Mi perfil</span>
            </a>
            <a routerLink="/notificaciones" routerLinkActive="ca-public-active" class="ca-public-link">
              <i class="pi pi-bell"></i>
              <span class="min-w-0 flex-1">Notificaciones</span>
              @if (unreadCount() > 0) {
                <span class="rounded-full bg-[var(--ca-gold)] px-2 py-0.5 text-xs font-black text-[var(--ca-navy)]">{{ unreadCount() }}</span>
              }
            </a>
            <a routerLink="/mis-reportes" routerLinkActive="ca-public-active" class="ca-public-link">
              <i class="pi pi-file-edit"></i><span>Mis reportes</span>
            </a>
          } @else {
            <a routerLink="/login" routerLinkActive="ca-public-active" class="ca-public-link">
              <i class="pi pi-sign-in"></i><span>Ingresar</span>
            </a>
          }
        </nav>

        <div class="mt-auto space-y-3">
          @if (isAdmin()) {
            <a routerLink="/admin" pButton class="w-full justify-center" icon="pi pi-shield" label="Panel admin"></a>
          }
          @if (isLoggedIn()) {
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-bold uppercase tracking-wide text-[var(--ca-teal)]">Mi cuenta</p>
              <p class="mt-2 truncate text-sm font-semibold">{{ userLabel() }}</p>
              <button pButton class="mt-3 w-full justify-center" size="small" severity="secondary" outlined icon="pi pi-sign-out" label="Salir" (click)="logout()"></button>
            </div>
          }
        </div>
      </aside>

      <main class="min-w-0 pb-20 lg:pb-0">
        <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div class="flex items-center justify-between">
            <a routerLink="/" class="flex items-center gap-3 font-semibold">
              <span class="grid h-10 w-10 place-items-center rounded-xl bg-[var(--ca-navy)] text-[var(--ca-gold)]">CA</span>
              <span>CuencaActiva</span>
            </a>
            @if (isAdmin()) {
              <a routerLink="/admin" pButton size="small" severity="secondary" outlined icon="pi pi-shield" label="Admin"></a>
            }
          </div>
        </header>

        <router-outlet />
      </main>

      <nav class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] lg:hidden" [class.grid-cols-6]="isLoggedIn()">
        <a routerLink="/" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="ca-mobile-active" class="ca-mobile-link">
          <i class="pi pi-home"></i><span>Inicio</span>
        </a>
        <a routerLink="/mapa" routerLinkActive="ca-mobile-active" class="ca-mobile-link">
          <i class="pi pi-map"></i><span>Mapa</span>
        </a>
        <a routerLink="/incidencias" routerLinkActive="ca-mobile-active" class="ca-mobile-link">
          <i class="pi pi-list"></i><span>Reportes</span>
        </a>
        @if (isLoggedIn()) {
          <a routerLink="/reportar" routerLinkActive="ca-mobile-active" class="ca-mobile-link">
            <i class="pi pi-plus-circle"></i><span>Crear</span>
          </a>
          <a routerLink="/notificaciones" routerLinkActive="ca-mobile-active" class="ca-mobile-link">
            <span class="relative">
              <i class="pi pi-bell"></i>
              @if (unreadCount() > 0) {
                <span class="absolute -right-2 -top-2 h-4 min-w-4 rounded-full bg-[var(--ca-gold)] px-1 text-[0.62rem] leading-4 text-[var(--ca-navy)]">{{ unreadCount() }}</span>
              }
            </span>
            <span>Avisos</span>
          </a>
          <a routerLink="/perfil" routerLinkActive="ca-mobile-active" class="ca-mobile-link">
            <i class="pi pi-user"></i><span>Cuenta</span>
          </a>
        } @else {
          <a routerLink="/login" routerLinkActive="ca-mobile-active" class="ca-mobile-link">
            <i class="pi pi-sign-in"></i><span>Entrar</span>
          </a>
        }
      </nav>
    </div>
  `,
})
export class PublicLayoutComponent {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly notificationsService = inject(NotificationsService);
  readonly isLoggedIn = computed(() => this.session.isAuthenticated());
  readonly isAdmin = computed(() => this.session.isAdmin());
  readonly unreadCount = computed(() => this.notificationsService.unreadCount());
  readonly userLabel = computed(() => {
    const user = this.session.user();
    return user?.aliasPublico || user?.nombres || user?.email || 'Mi cuenta';
  });
  private lastUserId: string | null = null;

  constructor() {
    effect(() => {
      const user = this.session.user();
      if (!user) {
        this.lastUserId = null;
        this.notificationsService.unreadCount.set(0);
        return;
      }

      if (this.lastUserId !== user.idUsuario) {
        this.lastUserId = user.idUsuario;
        this.notificationsService.countUnread().subscribe({ error: () => this.notificationsService.unreadCount.set(0) });
      }
    });
  }

  async logout() {
    await this.session.logout();
    await this.router.navigateByUrl('/');
  }
}
