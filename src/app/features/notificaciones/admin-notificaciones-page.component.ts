import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { AdminPushDestination, AdminPushNotificationResponse } from '../../core/models/notification.model';
import { NotificationsService } from '../../core/services/notifications.service';
import { UserProfileService } from '../../core/services/user-profile.service';

interface UserOption {
  label: string;
  value: string;
  email: string;
}

@Component({
  selector: 'app-admin-notificaciones-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TagModule,
    TextareaModule,
  ],
  template: `
    <div class="space-y-6">
      <div class="ca-panel flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <span class="block text-xs font-bold uppercase tracking-[0.15em] text-[var(--ca-teal)]">Comunicación</span>
          <h2 class="mt-1 text-2xl font-bold text-[var(--ca-navy)]">Notificaciones push</h2>
          <p class="mt-1 max-w-2xl text-xs text-slate-500">
            Envía avisos manuales a los ciudadanos con dispositivos registrados.
          </p>
        </div>
        <p-tag value="Solo administradores" severity="info"></p-tag>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section class="ca-panel p-6">
          <div class="grid gap-5">
            <div class="grid gap-4 md:grid-cols-[220px_1fr]">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-semibold uppercase text-slate-500">Destino</label>
                <p-select
                  [options]="destinationOptions"
                  [(ngModel)]="destino"
                  optionLabel="label"
                  optionValue="value"
                  styleClass="w-full"
                ></p-select>
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-xs font-semibold uppercase text-slate-500">Categoría</label>
                <input
                  pInputText
                  maxlength="60"
                  [(ngModel)]="categoria"
                  placeholder="Publicidad, campaña, emergencia..."
                  class="w-full"
                />
              </div>
            </div>

            @if (destino === 'USUARIOS') {
              <div class="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div class="grid gap-3 md:grid-cols-[1fr_auto]">
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold uppercase text-slate-500">Buscar usuarios activos</label>
                    <input
                      pInputText
                      [(ngModel)]="userSearch"
                      placeholder="Alias o correo"
                      class="w-full"
                      (keyup.enter)="loadUsers()"
                    />
                  </div>
                  <button
                    pButton
                    type="button"
                    icon="pi pi-search"
                    label="Buscar"
                    severity="secondary"
                    outlined
                    class="self-end"
                    [loading]="loadingUsers()"
                    (click)="loadUsers()"
                  ></button>
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-xs font-semibold uppercase text-slate-500">Destinatarios seleccionados</label>
                  <p-multiSelect
                    [options]="userOptions()"
                    [(ngModel)]="selectedUserIds"
                    optionLabel="label"
                    optionValue="value"
                    display="chip"
                    [filter]="true"
                    placeholder="Seleccionar usuarios"
                    styleClass="w-full"
                  ></p-multiSelect>
                </div>
              </div>
            }

            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between gap-3">
                <label class="text-xs font-semibold uppercase text-slate-500">Título</label>
                <span class="text-xs text-slate-400">{{ titulo.trim().length }}/150</span>
              </div>
              <input
                pInputText
                maxlength="150"
                [(ngModel)]="titulo"
                placeholder="Ej. Campaña de limpieza barrial"
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between gap-3">
                <label class="text-xs font-semibold uppercase text-slate-500">Mensaje</label>
                <span class="text-xs text-slate-400">{{ mensaje.trim().length }}/500</span>
              </div>
              <textarea
                pTextarea
                rows="7"
                maxlength="500"
                [(ngModel)]="mensaje"
                placeholder="Escribe el contenido que verá el ciudadano..."
                class="w-full resize-none"
              ></textarea>
            </div>

            <div class="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div class="text-xs text-slate-500">
                @if (destino === 'TODOS') {
                  Se enviará a todos los usuarios activos con dispositivos disponibles.
                } @else {
                  {{ selectedUserIds.length }} usuario(s) seleccionado(s).
                }
              </div>
              <button
                pButton
                type="button"
                icon="pi pi-send"
                label="Enviar push"
                [disabled]="!canSend()"
                [loading]="sending()"
                (click)="confirmSend()"
              ></button>
            </div>
          </div>
        </section>

        <aside class="space-y-6">
          <section class="ca-panel p-6">
            <h3 class="text-sm font-bold text-slate-800">Vista previa</h3>
            <div class="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ca-teal)]/10 text-[var(--ca-teal)]">
                  <i class="pi pi-bell"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold text-slate-900">{{ titulo.trim() || 'Título de la notificación' }}</p>
                  <p class="mt-1 line-clamp-4 text-sm leading-5 text-slate-600">{{ mensaje.trim() || 'Mensaje que recibirá el ciudadano en su dispositivo.' }}</p>
                  <p class="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{{ categoria.trim() || 'General' }}</p>
                </div>
              </div>
            </div>
          </section>

          @if (lastResult()) {
            <section class="ca-panel p-6">
              <h3 class="text-sm font-bold text-slate-800">Último envío</h3>
              <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div class="rounded-xl bg-slate-50 p-3">
                  <p class="text-xs text-slate-500">Destinatarios</p>
                  <p class="mt-1 text-xl font-bold text-slate-900">{{ lastResult()?.destinatarios }}</p>
                </div>
                <div class="rounded-xl bg-emerald-50 p-3">
                  <p class="text-xs text-emerald-700">Push enviados</p>
                  <p class="mt-1 text-xl font-bold text-emerald-800">{{ lastResult()?.pushesEnviados }}</p>
                </div>
                <div class="rounded-xl bg-amber-50 p-3">
                  <p class="text-xs text-amber-700">Sin dispositivo</p>
                  <p class="mt-1 text-xl font-bold text-amber-800">{{ lastResult()?.sinDispositivos }}</p>
                </div>
                <div class="rounded-xl bg-red-50 p-3">
                  <p class="text-xs text-red-700">Errores</p>
                  <p class="mt-1 text-xl font-bold text-red-800">{{ lastResult()?.errores }}</p>
                </div>
              </div>
            </section>
          }
        </aside>
      </div>
    </div>
  `,
})
export class AdminNotificacionesPageComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService);
  private readonly userProfileService = inject(UserProfileService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly userOptions = signal<UserOption[]>([]);
  readonly loadingUsers = signal(false);
  readonly sending = signal(false);
  readonly lastResult = signal<AdminPushNotificationResponse | null>(null);

  destino: AdminPushDestination = 'TODOS';
  categoria = 'General';
  titulo = '';
  mensaje = '';
  userSearch = '';
  selectedUserIds: string[] = [];

  readonly destinationOptions = [
    { label: 'Todos los usuarios activos', value: 'TODOS' },
    { label: 'Usuarios seleccionados', value: 'USUARIOS' },
  ];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loadingUsers.set(true);
    const search = this.userSearch.trim();

    this.userProfileService
      .listUsersAdmin({
        aliasPublico: search.includes('@') ? undefined : search,
        email: search.includes('@') ? search : undefined,
        estadoCuenta: 'ACTIVO',
        limit: 50,
        offset: 0,
      })
      .subscribe({
        next: (response) => {
          const options = response.data.map((user) => ({
            label: `${user.nombres} ${user.apellidos} (@${user.aliasPublico})`,
            value: user.idUsuario,
            email: user.email,
          }));
          this.userOptions.set(this.mergeSelectedOptions(options));
          this.loadingUsers.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar usuarios activos' });
          this.loadingUsers.set(false);
        },
      });
  }

  canSend(): boolean {
    if (!this.titulo.trim() || !this.mensaje.trim() || this.sending()) {
      return false;
    }

    return this.destino === 'TODOS' || this.selectedUserIds.length > 0;
  }

  confirmSend() {
    if (!this.canSend()) {
      return;
    }

    const destinoLabel = this.destino === 'TODOS' ? 'todos los usuarios activos' : `${this.selectedUserIds.length} usuario(s)`;

    this.confirmationService.confirm({
      header: 'Confirmar envío push',
      message: `¿Deseas enviar esta notificación a ${destinoLabel}?`,
      icon: 'pi pi-send',
      acceptLabel: 'Enviar',
      rejectLabel: 'Cancelar',
      accept: () => this.send(),
    });
  }

  private send() {
    this.sending.set(true);
    this.notificationsService
      .sendAdminPush({
        destino: this.destino,
        idUsuarios: this.destino === 'USUARIOS' ? this.selectedUserIds : [],
        titulo: this.titulo.trim(),
        mensaje: this.mensaje.trim(),
        categoria: this.categoria.trim() || 'General',
      })
      .subscribe({
        next: (response) => {
          this.lastResult.set(response);
          this.sending.set(false);
          this.messageService.add({
            severity: response.errores > 0 ? 'warn' : 'success',
            summary: 'Envío finalizado',
            detail: `${response.pushesEnviados} push enviados. ${response.sinDispositivos} usuario(s) sin dispositivo.`,
          });
        },
        error: (err) => {
          this.sending.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo enviar',
            detail: err.error?.message || 'Error al enviar la notificación push',
          });
        },
      });
  }

  private mergeSelectedOptions(options: UserOption[]): UserOption[] {
    const currentById = new Map(this.userOptions().map((option) => [option.value, option]));
    const mergedById = new Map(options.map((option) => [option.value, option]));

    this.selectedUserIds.forEach((id) => {
      const current = currentById.get(id);
      if (current && !mergedById.has(id)) {
        mergedById.set(id, current);
      }
    });

    return Array.from(mergedById.values());
  }
}
