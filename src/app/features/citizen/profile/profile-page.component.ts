import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { PointsMovement } from '../../../core/models/points-movement.model';
import { UserProfileService } from '../../../core/services/user-profile.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, ButtonModule, CardModule, InputTextModule, TagModule],
  template: `
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 overflow-hidden rounded-[30px] bg-[var(--ca-navy)] text-white shadow-xl shadow-slate-900/10">
        <div class="grid gap-5 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ca-gold)]">Zona ciudadana</p>
            <h1 class="mt-3 text-3xl font-semibold">Mi perfil</h1>
            <p class="mt-2 max-w-3xl leading-7 text-slate-300">
              Actualiza tus datos públicos y revisa el avance que has ganado participando en CuencaActiva.
            </p>
          </div>
          <a routerLink="/mis-reportes" pButton severity="secondary" outlined icon="pi pi-file-edit" label="Mis reportes"></a>
        </div>
      </section>

      @if (user(); as item) {
        <section class="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside class="space-y-6">
            <p-card styleClass="border-0 shadow-sm">
              <div class="flex flex-col items-center text-center">
                <div class="relative">
                  <span class="grid h-32 w-32 place-items-center overflow-hidden rounded-[2rem] bg-[var(--ca-navy)] text-4xl font-black text-[var(--ca-gold)] ring-4 ring-slate-100">
                    @if (avatarUrl()) {
                      <img [src]="avatarUrl()!" alt="Foto de perfil" class="h-full w-full object-cover" />
                    } @else {
                      {{ initials() }}
                    }
                  </span>
                  <label class="absolute -bottom-2 -right-2 grid h-11 w-11 cursor-pointer place-items-center rounded-2xl bg-[var(--ca-gold)] text-[var(--ca-navy)] shadow-lg transition hover:brightness-95">
                    <i class="pi pi-camera"></i>
                    <input class="hidden" type="file" accept="image/jpeg,image/png,image/webp" (change)="selectAvatar($event)" />
                  </label>
                </div>

                <h2 class="mt-5 text-xl font-semibold">{{ fullName() }}</h2>
                <p class="mt-1 text-sm text-slate-500">{{ item.email }}</p>
                <p class="mt-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {{ item.aliasPublico ? '@' + item.aliasPublico : 'Alias pendiente' }}
                </p>

                <div class="mt-4 flex flex-wrap justify-center gap-2">
                  @for (role of item.roles; track role) {
                    <p-tag [value]="role" severity="info"></p-tag>
                  }
                </div>

                @if (selectedAvatar()) {
                  <div class="mt-5 w-full rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-900">
                    <p class="font-semibold">Foto lista para guardar</p>
                    <p class="mt-1 truncate">{{ selectedAvatar()?.name }}</p>
                  </div>
                }
              </div>
            </p-card>

            <p-card styleClass="border-0 shadow-sm">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm text-slate-500">Puntos acumulados</p>
                  <strong class="mt-1 block text-4xl text-[var(--ca-teal)]">{{ item.puntosTotales }}</strong>
                </div>
                <span class="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-[var(--ca-teal)]">
                  <i class="pi pi-star-fill"></i>
                </span>
              </div>
              <div class="mt-5">
                <div class="flex items-center justify-between gap-3 text-sm">
                  <span class="font-semibold">{{ item.nombreNivelActual || item.codigoNivelActual || 'Nivel ciudadano' }}</span>
                  <span class="text-slate-500">{{ pointsToNextLevel() }}</span>
                </div>
                <div class="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div class="h-full rounded-full bg-[var(--ca-teal)] transition-all" [style.width.%]="levelProgress()"></div>
                </div>
                <div class="mt-2 flex justify-between text-xs text-slate-500">
                  <span>{{ item.puntosMinimosNivel ?? 0 }} pts</span>
                  <span>{{ item.puntosMaximosNivel ?? item.puntosTotales }} pts</span>
                </div>
              </div>
            </p-card>
          </aside>

          <section class="space-y-6">
            <p-card styleClass="border-0 shadow-sm">
              <ng-template pTemplate="header">
                <div class="border-b border-slate-100 px-5 py-4">
                  <h2 class="text-xl font-semibold">Datos de perfil</h2>
                  <p class="mt-1 text-sm text-slate-500">Estos datos ayudan a identificar tu participación ciudadana.</p>
                </div>
              </ng-template>

              <form [formGroup]="form" class="grid gap-5" (ngSubmit)="saveProfile()">
                <div class="grid gap-5 md:grid-cols-2">
                  <label class="block">
                    <span class="mb-2 block text-sm font-semibold text-slate-700">Nombres</span>
                    <input pInputText class="w-full" formControlName="nombres" maxlength="100" />
                    @if (controlInvalid('nombres')) {
                      <small class="mt-2 block text-red-600">Ingresa tus nombres.</small>
                    }
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-sm font-semibold text-slate-700">Apellidos</span>
                    <input pInputText class="w-full" formControlName="apellidos" maxlength="100" />
                    @if (controlInvalid('apellidos')) {
                      <small class="mt-2 block text-red-600">Ingresa tus apellidos.</small>
                    }
                  </label>
                </div>

                <div class="grid gap-5 md:grid-cols-2">
                  <label class="block">
                    <span class="mb-2 block text-sm font-semibold text-slate-700">Alias público</span>
                    <span class="p-input-icon-left w-full">
                      <i class="pi pi-at"></i>
                      <input pInputText class="w-full" formControlName="aliasPublico" maxlength="50" />
                    </span>
                    @if (controlInvalid('aliasPublico')) {
                      <small class="mt-2 block text-red-600">Usa 3 a 50 caracteres: letras, números, puntos, guiones o guion bajo.</small>
                    } @else {
                      <small class="mt-2 block text-slate-500">Así aparecerás en reportes, comentarios y validaciones.</small>
                    }
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-sm font-semibold text-slate-700">Teléfono</span>
                    <input pInputText class="w-full" formControlName="telefono" maxlength="20" placeholder="Opcional" />
                    @if (controlInvalid('telefono')) {
                      <small class="mt-2 block text-red-600">El teléfono no debe superar 20 caracteres.</small>
                    }
                  </label>
                </div>

                <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button pButton type="button" severity="secondary" outlined icon="pi pi-refresh" label="Restaurar" (click)="resetForm()" [disabled]="saving()"></button>
                  <button pButton type="submit" icon="pi pi-save" label="Guardar cambios" [loading]="saving()"></button>
                </div>
              </form>
            </p-card>

            <p-card styleClass="border-0 shadow-sm">
              <ng-template pTemplate="header">
                <div class="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 class="text-xl font-semibold">Movimientos de puntos</h2>
                    <p class="mt-1 text-sm text-slate-500">Actividad reciente de tu participación.</p>
                  </div>
                  <button pButton size="small" severity="secondary" outlined icon="pi pi-refresh" label="Actualizar" (click)="loadMovements()" [loading]="loadingMovements()"></button>
                </div>
              </ng-template>

              @if (loadingMovements()) {
                <div class="grid gap-3">
                  <div class="h-16 rounded-2xl bg-slate-100"></div>
                  <div class="h-16 rounded-2xl bg-slate-100"></div>
                  <div class="h-16 rounded-2xl bg-slate-100"></div>
                </div>
              } @else if (movementsError()) {
                <div class="rounded-2xl bg-slate-50 p-6 text-center">
                  <i class="pi pi-cloud-off text-2xl text-slate-400"></i>
                  <p class="mt-3 font-semibold">No pudimos cargar tus movimientos</p>
                  <p class="mt-1 text-sm text-slate-500">Intenta nuevamente en unos segundos.</p>
                </div>
              } @else if (movements().length === 0) {
                <div class="rounded-2xl bg-slate-50 p-6 text-center">
                  <i class="pi pi-sparkles text-2xl text-[var(--ca-gold)]"></i>
                  <p class="mt-3 font-semibold">Sin movimientos todavía</p>
                  <p class="mt-1 text-sm text-slate-500">Cuando reportes, votes o confirmes incidencias, verás tus puntos aquí.</p>
                </div>
              } @else {
                <div class="grid gap-3">
                  @for (movement of movements(); track movement.idMovimiento) {
                    <article class="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                      <span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-[var(--ca-teal)]">
                        <i class="pi pi-check-circle"></i>
                      </span>
                      <div class="min-w-0 flex-1">
                        <h3 class="truncate font-semibold">{{ movement.nombreAccion || 'Movimiento' }}</h3>
                        <p class="mt-1 truncate text-sm text-slate-500">
                          {{ movement.tituloIncidencia || movement.motivo || 'Actividad ciudadana' }}
                        </p>
                        <p class="mt-1 text-xs font-semibold text-slate-400">{{ movement.creadoEn | date:'dd MMM, HH:mm' }}</p>
                      </div>
                      <strong class="shrink-0 text-lg" [class.text-teal-600]="movement.puntos >= 0" [class.text-red-600]="movement.puntos < 0">
                        {{ movement.puntos >= 0 ? '+' : '' }}{{ movement.puntos }} pts
                      </strong>
                    </article>
                  }
                </div>
              }
            </p-card>
          </section>
        </section>
      }
    </main>
  `,
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(AuthSessionService);
  private readonly profileService = inject(UserProfileService);
  private readonly messageService = inject(MessageService);

  readonly user = computed(() => this.session.user());
  readonly selectedAvatar = signal<File | null>(null);
  readonly avatarPreview = signal<string | null>(null);
  readonly saving = signal(false);
  readonly loadingMovements = signal(false);
  readonly movementsError = signal(false);
  readonly movements = signal<PointsMovement[]>([]);
  readonly avatarUrl = computed(() => this.avatarPreview() || this.user()?.fotoPerfilUrl || null);
  readonly initials = computed(() => {
    const source = this.user()?.nombres || this.user()?.aliasPublico || this.user()?.email || 'CA';
    return source.slice(0, 2).toUpperCase();
  });
  readonly fullName = computed(() => {
    const user = this.user();
    return [user?.nombres, user?.apellidos].filter(Boolean).join(' ') || user?.aliasPublico || 'Ciudadano';
  });
  readonly levelProgress = computed(() => {
    const user = this.user();
    const min = user?.puntosMinimosNivel ?? 0;
    const max = user?.puntosMaximosNivel ?? 0;
    const points = user?.puntosTotales ?? 0;
    if (max <= min) {
      return 100;
    }
    return Math.max(0, Math.min(100, ((points - min) / (max - min)) * 100));
  });
  readonly pointsToNextLevel = computed(() => {
    const user = this.user();
    const max = user?.puntosMaximosNivel;
    if (max === null || max === undefined) {
      return 'Avance ciudadano';
    }
    const remaining = Math.max(0, max - (user?.puntosTotales ?? 0));
    return remaining === 0 ? 'Nivel completo' : `${remaining} pts para subir`;
  });

  readonly form = this.fb.nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    aliasPublico: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
    telefono: ['', Validators.maxLength(20)],
  });

  ngOnInit() {
    this.resetForm();
    this.loadMovements();
  }

  ngOnDestroy() {
    this.revokePreview();
  }

  controlInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  resetForm() {
    const user = this.user();
    this.form.reset({
      nombres: user?.nombres ?? '',
      apellidos: user?.apellidos ?? '',
      aliasPublico: user?.aliasPublico ?? '',
      telefono: user?.telefono ?? '',
    });
    this.clearAvatar();
  }

  selectAvatar(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file) {
      return;
    }

    try {
      this.profileService.validateAvatar(file);
      this.revokePreview();
      this.selectedAvatar.set(file);
      this.avatarPreview.set(URL.createObjectURL(file));
    } catch (error) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Foto no válida',
        detail: this.errorMessage(error, 'Selecciona otra imagen.'),
      });
    }
  }

  clearAvatar() {
    this.revokePreview();
    this.selectedAvatar.set(null);
  }

  async saveProfile() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Revisa tu perfil',
        detail: 'Hay campos que necesitan corrección antes de guardar.',
      });
      return;
    }

    const currentUser = this.user();
    if (!currentUser) {
      return;
    }

    this.saving.set(true);
    try {
      let photoUrl = currentUser.fotoPerfilUrl;
      const avatar = this.selectedAvatar();
      if (avatar) {
        photoUrl = await this.profileService.uploadProfilePhoto(avatar);
      }

      const value = this.form.getRawValue();
      await firstValueFrom(
        this.profileService.updateProfile({
          nombres: value.nombres,
          apellidos: value.apellidos,
          aliasPublico: value.aliasPublico,
          telefono: value.telefono,
          fotoPerfilUrl: photoUrl,
        }),
      );
      await this.session.loadCurrentUser();
      this.clearAvatar();
      this.messageService.add({
        severity: 'success',
        summary: 'Perfil actualizado',
        detail: 'Tus cambios se guardaron correctamente.',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'No se pudo guardar',
        detail: this.errorMessage(error, 'Intenta nuevamente en unos minutos.'),
      });
    } finally {
      this.saving.set(false);
    }
  }

  loadMovements() {
    this.loadingMovements.set(true);
    this.movementsError.set(false);
    this.profileService
      .listPointsMovements(20, 0)
      .pipe(finalize(() => this.loadingMovements.set(false)))
      .subscribe({
        next: (items) => this.movements.set(items),
        error: () => this.movementsError.set(true),
      });
  }

  private revokePreview() {
    const preview = this.avatarPreview();
    if (preview) {
      URL.revokeObjectURL(preview);
      this.avatarPreview.set(null);
    }
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string } | null;
      return body?.message || fallback;
    }
    return error instanceof Error ? error.message : fallback;
  }
}
