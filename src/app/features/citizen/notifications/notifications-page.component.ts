import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  imports: [RouterLink, ButtonModule, CardModule, TagModule],
  template: `
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 overflow-hidden rounded-[30px] bg-[var(--ca-navy)] text-white shadow-xl shadow-slate-900/10">
        <div class="grid gap-5 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ca-gold)]">Centro de avisos</p>
            <h1 class="mt-3 text-3xl font-semibold">Notificaciones</h1>
            <p class="mt-2 max-w-3xl leading-7 text-slate-300">
              Revisa comentarios, cambios de estado, alertas cercanas y logros de participación.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button pButton severity="secondary" outlined icon="pi pi-refresh" label="Actualizar" [loading]="loading()" (click)="load()"></button>
            <button pButton icon="pi pi-check" label="Marcar leídas" [disabled]="unreadCount() === 0 || actionLoading()" [loading]="markingAll()" (click)="markAllAsRead()"></button>
          </div>
        </div>
      </section>

      <section class="mb-6 grid gap-4 md:grid-cols-3">
        <p-card styleClass="ca-metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Sin leer</p>
              <strong class="mt-1 block text-3xl text-[var(--ca-teal)]">{{ unreadCount() }}</strong>
            </div>
            <span class="ca-metric-icon bg-teal-50 text-[var(--ca-teal)]"><i class="pi pi-bell"></i></span>
          </div>
        </p-card>
        <p-card styleClass="ca-metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Avisos cargados</p>
              <strong class="mt-1 block text-3xl">{{ notifications().length }}</strong>
            </div>
            <span class="ca-metric-icon bg-[var(--ca-navy)] text-white"><i class="pi pi-inbox"></i></span>
          </div>
        </p-card>
        <p-card styleClass="ca-metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Preferencias</p>
              <strong class="mt-1 block text-3xl text-[var(--ca-gold)]">{{ enabledPreferences() }}/{{ preferences().length }}</strong>
            </div>
            <span class="ca-metric-icon bg-amber-50 text-[var(--ca-gold)]"><i class="pi pi-sliders-h"></i></span>
          </div>
        </p-card>
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <p-card styleClass="border-0 shadow-sm">
          <ng-template pTemplate="header">
            <div class="border-b border-slate-100 px-5 py-4">
              <h2 class="text-xl font-semibold">Avisos recientes</h2>
              <p class="mt-1 text-sm text-slate-500">Toca un aviso para abrir el reporte relacionado cuando exista.</p>
            </div>
          </ng-template>

          @if (loading()) {
            <div class="grid gap-3">
              <div class="h-24 rounded-2xl bg-slate-100"></div>
              <div class="h-24 rounded-2xl bg-slate-100"></div>
              <div class="h-24 rounded-2xl bg-slate-100"></div>
            </div>
          } @else if (error()) {
            <div class="rounded-2xl bg-slate-50 p-8 text-center">
              <i class="pi pi-cloud-off text-3xl text-slate-400"></i>
              <p class="mt-3 font-semibold">No pudimos cargar tus notificaciones</p>
              <p class="mt-1 text-sm text-slate-500">Intenta nuevamente en unos segundos.</p>
              <button pButton class="mt-5" size="small" icon="pi pi-refresh" label="Reintentar" (click)="load()"></button>
            </div>
          } @else if (notifications().length === 0) {
            <div class="rounded-2xl bg-slate-50 p-8 text-center">
              <i class="pi pi-bell text-3xl text-slate-400"></i>
              <p class="mt-3 font-semibold">Aún no tienes notificaciones</p>
              <p class="mt-1 text-sm text-slate-500">Cuando haya comentarios, cambios o alertas relevantes, aparecerán aquí.</p>
            </div>
          } @else {
            <div class="grid gap-3">
              @for (notification of notifications(); track notification.idNotificacion) {
                <article
                  class="group grid cursor-pointer gap-4 rounded-3xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:grid-cols-[52px_1fr_auto]"
                  [class.border-teal-200]="!notification.leida"
                  [class.bg-teal-50]="!notification.leida"
                  [class.border-slate-200]="notification.leida"
                  [class.bg-white]="notification.leida"
                  (click)="openNotification(notification)"
                >
                  <span class="grid h-12 w-12 place-items-center rounded-2xl" [class]="notificationIconClass(notification.codigoTipo)">
                    <i [class]="notificationIcon(notification.codigoTipo)"></i>
                  </span>
                  <div class="min-w-0">
                    <div class="flex items-start gap-2">
                      <h3 class="min-w-0 flex-1 truncate font-semibold text-[var(--ca-navy)]">{{ notification.titulo || notification.nombreTipo }}</h3>
                      @if (!notification.leida) {
                        <span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--ca-gold)]"></span>
                      }
                    </div>
                    <p class="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{{ notification.mensaje }}</p>
                    <div class="mt-3 flex flex-wrap items-center gap-2">
                      <p-tag [value]="notification.nombreTipo" [severity]="tagSeverity(notification.codigoTipo)"></p-tag>
                      <span class="text-xs font-semibold text-slate-400">{{ relativeDate(notification.creadaEn) }}</span>
                    </div>
                  </div>
                  <div class="flex items-center justify-end gap-2 sm:flex-col sm:items-end sm:justify-center">
                    @if (!notification.leida) {
                      <button
                        pButton
                        type="button"
                        size="small"
                        severity="secondary"
                        outlined
                        icon="pi pi-check"
                        label="Leída"
                        [loading]="markingId() === notification.idNotificacion"
                        (click)="markAsRead(notification, $event)"
                      ></button>
                    }
                    @if (notification.idIncidencia) {
                      <span class="text-xs font-semibold text-slate-400">Ver reporte</span>
                    }
                  </div>
                </article>
              }
            </div>
          }
        </p-card>

        <aside class="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <p-card styleClass="border-0 shadow-sm">
            <ng-template pTemplate="header">
              <div class="border-b border-slate-100 px-5 py-4">
                <h2 class="text-lg font-semibold">Preferencias</h2>
                <p class="mt-1 text-sm text-slate-500">Elige qué avisos quieres recibir.</p>
              </div>
            </ng-template>

            @if (preferencesLoading()) {
              <div class="grid gap-3">
                <div class="h-20 rounded-2xl bg-slate-100"></div>
                <div class="h-20 rounded-2xl bg-slate-100"></div>
              </div>
            } @else if (preferences().length === 0) {
              <p class="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No hay preferencias disponibles por ahora.</p>
            } @else {
              <div class="grid gap-4">
                @for (preference of preferences(); track preference.codigoTipo) {
                  <section class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <h3 class="font-semibold">{{ preference.nombreTipo }}</h3>
                        <p class="mt-1 text-sm text-slate-500">{{ preferenceDescription(preference.codigoTipo) }}</p>
                      </div>
                      <label class="relative inline-flex cursor-pointer items-center">
                        <input
                          class="peer sr-only"
                          type="checkbox"
                          [checked]="preference.habilitada"
                          [disabled]="updatingPreference() === preference.codigoTipo"
                          (change)="togglePreference(preference, $event)"
                        />
                        <span class="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-[var(--ca-teal)] peer-disabled:opacity-60"></span>
                        <span class="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"></span>
                      </label>
                    </div>

                    @if (preference.codigoTipo === 'INCIDENCIA_CERCANA') {
                      <div class="mt-4">
                        <div class="mb-2 flex items-center justify-between text-sm">
                          <span class="font-semibold text-slate-700">Radio de cercanía</span>
                          <span class="text-slate-500">{{ normalizedRadius(preference.radioCercaniaKm).toFixed(1) }} km</span>
                        </div>
                        <input
                          class="ca-range w-full"
                          type="range"
                          min="0.5"
                          max="20"
                          step="0.5"
                          [value]="normalizedRadius(preference.radioCercaniaKm)"
                          [disabled]="!preference.habilitada || updatingPreference() === preference.codigoTipo"
                          (change)="updateRadius(preference, $event)"
                        />
                        <div class="mt-1 flex justify-between text-xs text-slate-400">
                          <span>0.5 km</span>
                          <span>20 km</span>
                        </div>
                        <p class="mt-3 text-xs leading-5 text-slate-500">Este rango se usa para alertas de incidencias cercanas.</p>
                      </div>
                    }
                  </section>
                }
              </div>
            }
          </p-card>

          <p-card styleClass="border-0 bg-[var(--ca-navy)] text-white shadow-sm">
            <i class="pi pi-info-circle text-2xl text-[var(--ca-gold)]"></i>
            <h2 class="mt-4 text-lg font-semibold">Avisos ciudadanos</h2>
            <p class="mt-3 text-sm leading-6 text-slate-300">Las notificaciones te ayudan a seguir reportes, cambios y actividad cercana sin perder contexto.</p>
            <a routerLink="/incidencias" class="mt-5 inline-flex" pButton severity="secondary" outlined icon="pi pi-list" label="Ver incidencias"></a>
          </p-card>
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
