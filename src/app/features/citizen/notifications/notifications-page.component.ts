import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AppNotification, NotificationPreference } from '../../../core/models/notification.model';
import { NotificationsService } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [ButtonModule, CardModule, TagModule],
  template: `
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- PAGE HEADER: Light and elegant inbox -->
      <header class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-[var(--ca-teal)]">Centro de avisos</span>
          <h1 class="text-3xl font-bold tracking-tight text-slate-900 mt-1">Notificaciones</h1>
          <p class="mt-1 text-sm text-slate-500">Mantente al tanto de la actividad de tus reportes, comentarios y alertas locales.</p>
        </div>
        <div class="flex flex-wrap gap-2.5 shrink-0 sm:self-end">
          <button pButton severity="secondary" outlined icon="pi pi-refresh" label="Actualizar" [loading]="loading()" (click)="load()" class="hover:bg-slate-50 transition-colors"></button>
          <button pButton icon="pi pi-check" label="Marcar todas como leídas" [disabled]="unreadCount() === 0 || actionLoading()" [loading]="markingAll()" (click)="markAllAsRead()" class="transition-all"></button>
        </div>
      </header>

      <section class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <!-- NOTIFICATIONS LIST -->
        <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div class="border-b border-slate-100 px-6 py-5 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-800">Bandeja de entrada</h2>
              <p class="mt-1 text-sm text-slate-500">Toca un aviso para ver los detalles del reporte.</p>
            </div>
            @if (unreadCount() > 0) {
              <span class="inline-flex items-center rounded-full bg-[var(--ca-teal)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--ca-teal)]">
                {{ unreadCount() }} pendientes
              </span>
            }
          </div>

          <div class="p-4 sm:p-6">
            @if (loading()) {
              <div class="space-y-3">
                <div class="h-20 rounded-xl bg-slate-50 animate-pulse border border-slate-100"></div>
                <div class="h-20 rounded-xl bg-slate-50 animate-pulse border border-slate-100"></div>
              </div>
            } @else if (error()) {
              <div class="rounded-xl bg-red-50/50 border border-red-100 p-8 text-center">
                <i class="pi pi-cloud-off text-2xl text-red-500"></i>
                <p class="mt-3 font-bold text-red-800">Error al cargar las notificaciones</p>
                <p class="mt-0.5 text-xs text-red-600">No pudimos sincronizar tu bandeja en este momento.</p>
                <button pButton class="mt-4" size="small" icon="pi pi-refresh" label="Reintentar" (click)="load()"></button>
              </div>
            } @else if (notifications().length === 0) {
              <div class="rounded-xl bg-slate-50/50 border border-slate-100 p-8 text-center">
                <i class="pi pi-bell text-2xl text-slate-400"></i>
                <p class="mt-3 font-bold text-slate-700">Bandeja limpia</p>
                <p class="mt-1 text-xs text-slate-500">No tienes notificaciones en este momento. ¡Buen trabajo!</p>
              </div>
            } @else {
              <div class="divide-y divide-slate-100">
                @for (notification of notifications(); track notification.idNotificacion) {
                  <article
                    class="group py-4 first:pt-0 last:pb-0 flex items-start gap-4 cursor-pointer hover:bg-slate-50/50 rounded-xl px-3 -mx-3 transition-colors duration-200"
                    (click)="openNotification(notification)"
                  >
                    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl" [class]="notificationIconClass(notification.codigoTipo)">
                      <i [class]="notificationIcon(notification.codigoTipo) + ' text-sm'"></i>
                    </span>
                    
                    <div class="min-w-0 flex-1">
                      <div class="flex items-start gap-2 justify-between">
                        <h3 class="font-bold text-sm" [class.text-slate-900]="!notification.leida" [class.text-slate-600]="notification.leida">
                          {{ notification.titulo || notification.nombreTipo }}
                        </h3>
                        <span class="text-[11px] font-medium text-slate-400 shrink-0">{{ relativeDate(notification.creadaEn) }}</span>
                      </div>
                      <p class="mt-1 text-xs leading-relaxed text-slate-500" [class.font-medium]="!notification.leida">
                        {{ notification.mensaje }}
                      </p>
                      <div class="mt-2.5 flex items-center gap-2">
                        <p-tag [value]="notification.nombreTipo" [severity]="tagSeverity(notification.codigoTipo)"></p-tag>
                        @if (!notification.leida) {
                          <span class="inline-flex h-2 w-2 rounded-full bg-[var(--ca-gold)]"></span>
                        }
                      </div>
                    </div>

                    @if (!notification.leida) {
                      <button
                        pButton
                        type="button"
                        size="small"
                        severity="secondary"
                        outlined
                        icon="pi pi-check"
                        [loading]="markingId() === notification.idNotificacion"
                        (click)="markAsRead(notification, $event)"
                        class="p-button-text hover:bg-slate-100 rounded-lg shrink-0 self-center"
                      ></button>
                    }
                  </article>
                }
              </div>
            }
          </div>
        </div>

        <!-- PREFERENCES SIDEBAR -->
        <aside class="space-y-6">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-base font-bold text-slate-800 mb-1.5">Preferencias</h2>
            <p class="text-xs text-slate-500 mb-4">Personaliza los tipos de notificaciones que deseas recibir.</p>

            @if (preferencesLoading()) {
              <div class="space-y-3">
                <div class="h-16 rounded-xl bg-slate-50 animate-pulse border border-slate-100"></div>
                <div class="h-16 rounded-xl bg-slate-50 animate-pulse border border-slate-100"></div>
              </div>
            } @else if (preferences().length === 0) {
              <p class="rounded-xl bg-slate-50/50 border border-slate-100 p-4 text-xs text-slate-500 text-center">No hay preferencias por configurar.</p>
            } @else {
              <div class="space-y-4">
                @for (preference of preferences(); track preference.codigoTipo) {
                  <div class="rounded-xl border border-slate-150 bg-slate-50 p-4">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <h3 class="text-xs font-bold text-slate-800">{{ preference.nombreTipo }}</h3>
                        <p class="mt-1 text-[11px] leading-relaxed text-slate-400">{{ preferenceDescription(preference.codigoTipo) }}</p>
                      </div>
                      <label class="relative inline-flex cursor-pointer items-center shrink-0">
                        <input
                          class="peer sr-only"
                          type="checkbox"
                          [checked]="preference.habilitada"
                          [disabled]="updatingPreference() === preference.codigoTipo"
                          (change)="togglePreference(preference, $event)"
                        />
                        <span class="h-5 w-9 rounded-full bg-slate-300 transition peer-checked:bg-[var(--ca-teal)] peer-disabled:opacity-60"></span>
                        <span class="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4"></span>
                      </label>
                    </div>

                    @if (preference.codigoTipo === 'INCIDENCIA_CERCANA') {
                      <div class="mt-4 pt-3 border-t border-slate-200/60">
                        <div class="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span>Radio de alerta</span>
                          <span class="text-[var(--ca-teal)]">{{ normalizedRadius(preference.radioCercaniaKm).toFixed(1) }} km</span>
                        </div>
                        <input
                          class="ca-range w-full accent-[var(--ca-teal)]"
                          type="range"
                          min="0.5"
                          max="20"
                          step="0.5"
                          [value]="normalizedRadius(preference.radioCercaniaKm)"
                          [disabled]="!preference.habilitada || updatingPreference() === preference.codigoTipo"
                          (change)="updateRadius(preference, $event)"
                        />
                        <div class="mt-1 flex justify-between text-[10px] font-bold text-slate-400">
                          <span>0.5 km</span>
                          <span>20 km</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Info Helper Card -->
          <div class="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
            <i class="pi pi-info-circle text-xl text-[var(--ca-teal)]"></i>
            <h2 class="mt-3 text-base font-bold text-slate-800">Bandeja de avisos</h2>
            <p class="mt-2 text-xs leading-relaxed text-slate-500">Mantener tus notificaciones al día te ayuda a conocer de inmediato cuándo se resuelven o validan los reportes en tu sector.</p>
          </div>
        </aside>
      </section>
    </main>
  `,
})
export class NotificationsPageComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly notifications = signal<AppNotification[]>([]);
  readonly preferences = signal<NotificationPreference[]>([]);
  readonly loading = signal(false);
  readonly preferencesLoading = signal(false);
  readonly error = signal(false);
  readonly markingId = signal<string | null>(null);
  readonly markingAll = signal(false);
  readonly updatingPreference = signal<string | null>(null);
  readonly unreadCount = computed(() => this.notificationsService.unreadCount());
  readonly actionLoading = computed(() => this.markingAll() || !!this.markingId() || !!this.updatingPreference());
  readonly enabledPreferences = computed(() => this.preferences().filter((item) => item.habilitada).length);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.preferencesLoading.set(true);
    this.error.set(false);
    forkJoin({
      notifications: this.notificationsService.list(30, 0),
      unread: this.notificationsService.countUnread(),
      preferences: this.notificationsService.listPreferences(),
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.preferencesLoading.set(false);
        }),
      )
      .subscribe({
        next: ({ notifications, preferences }) => {
          this.notifications.set(notifications);
          this.preferences.set(preferences);
        },
        error: () => {
          this.error.set(true);
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudieron cargar los avisos',
            detail: 'Intenta nuevamente en unos segundos.',
          });
        },
      });
  }

  markAsRead(notification: AppNotification, event?: Event) {
    event?.stopPropagation();
    if (notification.leida || this.markingId()) {
      return;
    }

    this.markingId.set(notification.idNotificacion);
    this.notificationsService
      .markAsRead(notification.idNotificacion)
      .pipe(finalize(() => this.markingId.set(null)))
      .subscribe({
        next: (updated) => {
          this.notifications.update((items) =>
            items.map((item) => (item.idNotificacion === updated.idNotificacion ? updated : item)),
          );
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo actualizar',
            detail: 'Intenta nuevamente.',
          });
        },
      });
  }

  markAllAsRead() {
    if (this.unreadCount() === 0 || this.markingAll()) {
      return;
    }

    this.markingAll.set(true);
    this.notificationsService
      .markAllAsRead()
      .pipe(finalize(() => this.markingAll.set(false)))
      .subscribe({
        next: () => {
          const now = new Date().toISOString();
          this.notifications.update((items) => items.map((item) => ({ ...item, leida: true, leidaEn: item.leidaEn ?? now })));
          this.messageService.add({
            severity: 'success',
            summary: 'Notificaciones actualizadas',
            detail: 'Todos los avisos quedaron marcados como leídos.',
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo actualizar',
            detail: 'Intenta nuevamente.',
          });
        },
      });
  }

  openNotification(notification: AppNotification) {
    if (!notification.leida) {
      this.markAsRead(notification);
    }
    if (notification.idIncidencia) {
      void this.router.navigate(['/incidencias', notification.idIncidencia]);
    }
  }

  togglePreference(preference: NotificationPreference, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.savePreference(preference, checked, preference.radioCercaniaKm);
  }

  updateRadius(preference: NotificationPreference, event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.savePreference(preference, preference.habilitada, value);
  }

  normalizedRadius(value: number | null): number {
    return Math.max(0.5, Math.min(20, value ?? 2));
  }

  preferenceDescription(codigoTipo: string): string {
    switch (codigoTipo) {
      case 'NUEVO_COMENTARIO':
        return 'Cuando alguien comenta en reportes que sigues.';
      case 'CAMBIO_ESTADO':
        return 'Cuando cambia el avance de una incidencia.';
      case 'INCIDENCIA_CERCANA':
        return 'Alertas de reportes cerca de tu ubicación.';
      case 'LOGRO_DESBLOQUEADO':
        return 'Avisos por logros y avances de participación.';
      default:
        return 'Controla este tipo de aviso en tu cuenta.';
    }
  }

  notificationIcon(codigoTipo: string): string {
    switch (codigoTipo) {
      case 'NUEVO_COMENTARIO':
        return 'pi pi-comments';
      case 'CAMBIO_ESTADO':
        return 'pi pi-sync';
      case 'INCIDENCIA_CERCANA':
        return 'pi pi-map-marker';
      case 'LOGRO_DESBLOQUEADO':
        return 'pi pi-trophy';
      default:
        return 'pi pi-bell';
    }
  }

  notificationIconClass(codigoTipo: string): string {
    switch (codigoTipo) {
      case 'NUEVO_COMENTARIO':
        return 'bg-teal-50 text-[var(--ca-teal)]';
      case 'CAMBIO_ESTADO':
        return 'bg-amber-50 text-[var(--ca-gold)]';
      case 'INCIDENCIA_CERCANA':
        return 'bg-red-50 text-red-600';
      case 'LOGRO_DESBLOQUEADO':
        return 'bg-emerald-50 text-emerald-600';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  }

  tagSeverity(codigoTipo: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (codigoTipo) {
      case 'LOGRO_DESBLOQUEADO':
        return 'success';
      case 'CAMBIO_ESTADO':
        return 'warn';
      case 'INCIDENCIA_CERCANA':
        return 'danger';
      case 'NUEVO_COMENTARIO':
        return 'info';
      default:
        return 'secondary';
    }
  }

  relativeDate(value: string | null): string {
    if (!value) {
      return '';
    }
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) {
      return 'Ahora';
    }
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} h`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days} d`;
    }
    return new Date(value).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
  }

  private savePreference(preference: NotificationPreference, habilitada: boolean, radioCercaniaKm: number | null) {
    if (this.updatingPreference()) {
      return;
    }

    this.updatingPreference.set(preference.codigoTipo);
    this.notificationsService
      .updatePreference(preference.codigoTipo, habilitada, preference.codigoTipo === 'INCIDENCIA_CERCANA' ? this.normalizedRadius(radioCercaniaKm) : radioCercaniaKm)
      .pipe(finalize(() => this.updatingPreference.set(null)))
      .subscribe({
        next: (updated) => {
          this.preferences.update((items) => items.map((item) => (item.codigoTipo === updated.codigoTipo ? updated : item)));
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo actualizar la preferencia',
            detail: 'Intenta nuevamente.',
          });
        },
      });
  }
}
