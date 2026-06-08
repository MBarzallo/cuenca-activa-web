import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
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
    <div 
      [class.lg:grid-cols-[260px_1fr]]="!sidebarCollapsed()" 
      [class.lg:grid-cols-[80px_1fr]]="sidebarCollapsed()" 
      class="min-h-screen bg-[var(--ca-bg)] text-[var(--ca-navy)] lg:grid transition-all duration-300"
    >
      <!-- DESKTOP SIDEBAR -->
      <aside 
        [class.w-[260px]]="!sidebarCollapsed()" 
        [class.w-[80px]]="sidebarCollapsed()" 
        [class.px-4]="!sidebarCollapsed()"
        [class.px-2]="sidebarCollapsed()"
        class="sticky top-0 z-30 hidden h-screen flex-col border-r border-slate-200 bg-white py-5 shadow-xs lg:flex transition-all duration-300 relative"
      >
        <!-- Collapse toggle button circular on the border -->
        <button 
          (click)="toggleSidebar()" 
          class="absolute top-[38px] -right-3.5 z-40 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-xs transition hover:bg-slate-50 hover:text-[var(--ca-teal)] cursor-pointer"
          [title]="sidebarCollapsed() ? 'Expandir menú' : 'Colapsar menú'"
        >
          <i class="pi text-[10px] font-bold" [class.pi-chevron-right]="sidebarCollapsed()" [class.pi-chevron-left]="!sidebarCollapsed()"></i>
        </button>

        <!-- Brand/Logo -->
        @if (!sidebarCollapsed()) {
          <a routerLink="/" class="mb-6 flex items-center gap-3 rounded-2xl bg-[var(--ca-navy)] p-3 text-white transition-all">
            <img src="/logo/icon_only_white.png" class="h-10 w-10 object-contain" alt="CA Logo" />
            <span>
              <span class="block font-semibold leading-5 text-sm">CuencaActiva</span>
              <span class="text-[10px] text-slate-300">Ciudadanía en acción</span>
            </span>
          </a>
        } @else {
          <a routerLink="/" class="mb-6 flex items-center justify-center rounded-2xl bg-[var(--ca-navy)] p-2.5 text-white w-12 h-12 mx-auto transition-all" title="CuencaActiva">
            <img src="/logo/icon_only_white.png" class="h-7 w-7 object-contain" alt="CA Logo" />
          </a>
        }

        <!-- Navegación Principal -->
        <div class="mb-5">
          @if (!sidebarCollapsed()) {
            <span class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Navegación</span>
          } @else {
            <hr class="border-slate-100 my-2 mx-1" />
          }
          <nav class="mt-2 space-y-1">
            <a routerLink="/" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="ca-public-active" [class.ca-compact-link]="sidebarCollapsed()" class="ca-public-link relative" [title]="sidebarCollapsed() ? 'Inicio' : ''">
              <i class="pi pi-home"></i>
              @if (!sidebarCollapsed()) {
                <span>Inicio</span>
              }
            </a>
            <a routerLink="/mapa" routerLinkActive="ca-public-active" [class.ca-compact-link]="sidebarCollapsed()" class="ca-public-link relative" [title]="sidebarCollapsed() ? 'Mapa ciudadano' : ''">
              <i class="pi pi-map"></i>
              @if (!sidebarCollapsed()) {
                <span>Mapa ciudadano</span>
              }
            </a>
            <a routerLink="/incidencias" routerLinkActive="ca-public-active" [class.ca-compact-link]="sidebarCollapsed()" class="ca-public-link relative" [title]="sidebarCollapsed() ? 'Incidencias' : ''">
              <i class="pi pi-list"></i>
              @if (!sidebarCollapsed()) {
                <span>Incidencias</span>
              }
            </a>
          </nav>
        </div>

        <!-- Acciones de Cuenta / Participación -->
        <div class="mb-5">
          @if (!sidebarCollapsed()) {
            <span class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Mi Cuenta</span>
          } @else {
            <hr class="border-slate-100 my-2 mx-1" />
          }
          <nav class="mt-2 space-y-1">
            @if (isLoggedIn()) {
              <a routerLink="/reportar" routerLinkActive="ca-public-active" [class.ca-compact-link]="sidebarCollapsed()" class="ca-public-link relative" [title]="sidebarCollapsed() ? 'Crear reporte' : ''">
                <i class="pi pi-plus-circle"></i>
                @if (!sidebarCollapsed()) {
                  <span>Crear reporte</span>
                }
              </a>
              <a routerLink="/perfil" routerLinkActive="ca-public-active" [class.ca-compact-link]="sidebarCollapsed()" class="ca-public-link relative" [title]="sidebarCollapsed() ? 'Ajustes de perfil' : ''">
                <i class="pi pi-user"></i>
                @if (!sidebarCollapsed()) {
                  <span>Ajustes de perfil</span>
                }
              </a>
              <a routerLink="/notificaciones" routerLinkActive="ca-public-active" [class.ca-compact-link]="sidebarCollapsed()" class="ca-public-link relative" [title]="sidebarCollapsed() ? 'Notificaciones' : ''">
                <i class="pi pi-bell"></i>
                @if (!sidebarCollapsed()) {
                  <span class="min-w-0 flex-1">Notificaciones</span>
                  @if (unreadCount() > 0) {
                    <span class="rounded-full bg-[var(--ca-gold)] px-2 py-0.5 text-xs font-black text-[var(--ca-navy)]">{{ unreadCount() }}</span>
                  }
                } @else {
                  @if (unreadCount() > 0) {
                    <span class="absolute right-3 top-2.5 block h-2.5 w-2.5 rounded-full bg-[var(--ca-gold)] border border-white animate-pulse"></span>
                  }
                }
              </a>
              <a routerLink="/mis-reportes" routerLinkActive="ca-public-active" [class.ca-compact-link]="sidebarCollapsed()" class="ca-public-link relative" [title]="sidebarCollapsed() ? 'Mis reportes' : ''">
                <i class="pi pi-file-edit"></i>
                @if (!sidebarCollapsed()) {
                  <span>Mis reportes</span>
                }
              </a>
            } @else {
              <a routerLink="/login" routerLinkActive="ca-public-active" [class.ca-compact-link]="sidebarCollapsed()" class="ca-public-link relative" [title]="sidebarCollapsed() ? 'Ingresar' : ''">
                <i class="pi pi-sign-in"></i>
                @if (!sidebarCollapsed()) {
                  <span>Ingresar</span>
                }
              </a>
            }
          </nav>
        </div>

        <div class="mt-auto flex flex-col gap-4">
          <!-- Admin Button -->
          @if (isAdmin()) {
            @if (!sidebarCollapsed()) {
              <a routerLink="/admin" pButton class="w-full justify-center" icon="pi pi-shield" label="Panel admin"></a>
            } @else {
              <a 
                routerLink="/admin" 
                routerLinkActive="ca-public-active" 
                [class.ca-compact-link]="sidebarCollapsed()" 
                class="ca-public-link relative" 
                title="Panel admin"
              >
                <i class="pi pi-shield"></i>
              </a>
            }
          }

          <!-- Account Section -->
          @if (isLoggedIn()) {
            @if (!sidebarCollapsed()) {
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center">
                <p class="text-xs font-bold uppercase tracking-wide text-[var(--ca-teal)] self-start">Mi cuenta</p>
                <p class="mt-2 truncate text-sm font-semibold w-full text-slate-800">{{ userLabel() }}</p>
                <button pButton class="mt-3 w-full justify-center" size="small" severity="secondary" outlined icon="pi pi-sign-out" label="Salir" (click)="logout()"></button>
              </div>
            } @else {
              <div class="flex flex-col items-center gap-3 py-1">
                <!-- Avatar -->
                <span 
                  class="grid h-12 w-12 place-items-center rounded-full bg-[var(--ca-teal)]/10 text-[var(--ca-teal)] font-bold text-sm hover:bg-[var(--ca-teal)]/20 transition-all cursor-pointer border border-[var(--ca-teal)]/20 shadow-xs" 
                  [title]="userLabel()"
                >
                  {{ userLabel().slice(0, 2).toUpperCase() }}
                </span>
                
                <!-- Log out -->
                <button 
                  (click)="logout()" 
                  class="flex h-12 w-12 items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-650 transition-all cursor-pointer" 
                  title="Salir"
                >
                  <i class="pi pi-sign-out text-lg"></i>
                </button>
              </div>
            }
          }
        </div>
      </aside>

      <!-- MAIN CONTENT WRAPPER -->
      <main class="min-w-0 pb-20 lg:pb-0">
        <!-- Header for mobile -->
        <header class="sticky top-0 z-[1010] border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div class="flex items-center justify-between">
            <a routerLink="/" class="flex items-center gap-3 font-semibold">
              <img src="/logo/icon_only.png" class="h-10 w-10 object-contain" alt="CA Logo" />
              <span>CuencaActiva</span>
            </a>
            <div class="flex items-center gap-2">
              @if (isAdmin()) {
                <a routerLink="/admin" pButton size="small" severity="secondary" outlined icon="pi pi-shield" label="Admin" class="p-button-sm"></a>
              }
              <button pButton size="small" severity="secondary" outlined icon="pi pi-bars" (click)="toggleMobileMenu()" class="p-button-sm"></button>
            </div>
          </div>
        </header>

        <router-outlet />
      </main>

      <!-- MOBILE DRAWER OVERLAY -->
      @if (mobileMenuOpen()) {
        <div class="fixed inset-0 z-[2010] bg-slate-900/40 backdrop-blur-xs lg:hidden" (click)="closeMobileMenu()"></div>
      }

      <!-- MOBILE DRAWER MENU -->
      <div class="fixed inset-y-0 right-0 z-[2020] w-72 transform bg-white p-5 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden"
           [class.translate-x-0]="mobileMenuOpen()" [class.translate-x-full]="!mobileMenuOpen()">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div class="flex items-center gap-2">
            <img src="/logo/icon_only.png" class="h-8 w-8 object-contain" alt="CA Logo" />
            <span class="font-bold text-slate-800">Menú</span>
          </div>
          <button pButton size="small" severity="secondary" rounded [outlined]="true" icon="pi pi-times" (click)="closeMobileMenu()"></button>
        </div>

        <div class="flex flex-col h-[calc(100%-60px)] overflow-y-auto">
          <!-- Navegación Principal -->
          <div class="mb-5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Navegación</span>
            <nav class="mt-2 space-y-1">
              <a routerLink="/" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="ca-public-active" (click)="closeMobileMenu()" class="ca-public-link">
                <i class="pi pi-home"></i><span>Inicio</span>
              </a>
              <a routerLink="/mapa" routerLinkActive="ca-public-active" (click)="closeMobileMenu()" class="ca-public-link">
                <i class="pi pi-map"></i><span>Mapa ciudadano</span>
              </a>
              <a routerLink="/incidencias" routerLinkActive="ca-public-active" (click)="closeMobileMenu()" class="ca-public-link">
                <i class="pi pi-list"></i><span>Incidencias</span>
              </a>
            </nav>
          </div>

          <!-- Acciones de Cuenta -->
          <div class="mb-5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mi Cuenta</span>
            <nav class="mt-2 space-y-1">
              @if (isLoggedIn()) {
                <a routerLink="/reportar" routerLinkActive="ca-public-active" (click)="closeMobileMenu()" class="ca-public-link">
                  <i class="pi pi-plus-circle"></i><span>Crear reporte</span>
                </a>
                <a routerLink="/perfil" routerLinkActive="ca-public-active" (click)="closeMobileMenu()" class="ca-public-link">
                  <i class="pi pi-user"></i><span>Ajustes de perfil</span>
                </a>
                <a routerLink="/notificaciones" routerLinkActive="ca-public-active" (click)="closeMobileMenu()" class="ca-public-link">
                  <i class="pi pi-bell"></i>
                  <span class="min-w-0 flex-1">Notificaciones</span>
                  @if (unreadCount() > 0) {
                    <span class="rounded-full bg-[var(--ca-gold)] px-2 py-0.5 text-xs font-black text-[var(--ca-navy)]">{{ unreadCount() }}</span>
                  }
                </a>
                <a routerLink="/mis-reportes" routerLinkActive="ca-public-active" (click)="closeMobileMenu()" class="ca-public-link">
                  <i class="pi pi-file-edit"></i><span>Mis reportes</span>
                </a>
              } @else {
                <a routerLink="/login" routerLinkActive="ca-public-active" (click)="closeMobileMenu()" class="ca-public-link">
                  <i class="pi pi-sign-in"></i><span>Ingresar</span>
                </a>
              }
            </nav>
          </div>

          <div class="mt-auto space-y-3 pb-8">
            @if (isAdmin()) {
              <a routerLink="/admin" pButton class="w-full justify-center" icon="pi pi-shield" label="Panel admin" (click)="closeMobileMenu()"></a>
            }
            @if (isLoggedIn()) {
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-[10px] font-bold uppercase tracking-wide text-[var(--ca-teal)]">Mi cuenta</p>
                <p class="mt-1 truncate text-xs font-semibold">{{ userLabel() }}</p>
                <button pButton class="mt-3 w-full justify-center p-button-sm" severity="secondary" outlined icon="pi pi-sign-out" label="Salir" (click)="logoutMobile()"></button>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- MOBILE BOTTOM NAVIGATION -->
      <nav class="fixed inset-x-0 bottom-0 z-[1010] grid grid-cols-4 border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] lg:hidden" [class.grid-cols-6]="isLoggedIn()">
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
export class PublicLayoutComponent implements OnInit {
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
  readonly mobileMenuOpen = signal(false);
  readonly sidebarCollapsed = signal(false);

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  async logoutMobile() {
    this.closeMobileMenu();
    await this.logout();
  }

  toggleSidebar() {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
    localStorage.setItem('ca-sidebar-collapsed', String(this.sidebarCollapsed()));
  }

  ngOnInit() {
    const saved = localStorage.getItem('ca-sidebar-collapsed');
    this.sidebarCollapsed.set(saved === 'true');
  }

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
