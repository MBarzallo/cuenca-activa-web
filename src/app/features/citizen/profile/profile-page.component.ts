import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { linkWithPhoneNumber, PhoneAuthProvider, RecaptchaVerifier, unlink } from 'firebase/auth';
import { firebaseAuth } from '../../../core/firebase/firebase.client';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink, DatePipe, ButtonModule, CardModule, InputTextModule, TagModule],
  template: `
    <main class="ca-page-shell">
      <!-- PAGE HEADER: Light and personal -->
      <header class="ca-page-header">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-[var(--ca-teal)]">Zona ciudadana</span>
          <h1 class="text-3xl font-bold tracking-tight text-slate-900 mt-1">Ajustes de mi cuenta</h1>
          <p class="mt-1 text-sm text-slate-500">Administra tus datos personales, tu alias público e información de contacto.</p>
        </div>
        <div class="flex flex-wrap gap-2.5 shrink-0 sm:self-end">
          <a routerLink="/mis-reportes" pButton severity="secondary" outlined icon="pi pi-file-edit" label="Mis reportes" class="hover:bg-slate-50"></a>
        </div>
      </header>

      @if (user(); as item) {
        <section class="grid gap-8 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside class="space-y-6">
            <!-- AVATAR & BASIC DETAILS -->
            <div class="ca-panel p-6">
              <div class="flex flex-col items-center text-center">
                <div class="relative">
                  <span class="grid h-32 w-32 place-items-center overflow-hidden rounded-[2rem] bg-slate-900 text-4xl font-black text-[var(--ca-gold)] ring-4 ring-slate-100">
                    @if (avatarUrl()) {
                      <img [src]="avatarUrl()!" alt="Foto de perfil" class="h-full w-full object-cover" />
                    } @else {
                      {{ initials() }}
                    }
                  </span>
                  <label class="absolute -bottom-2 -right-2 grid h-10 w-10 cursor-pointer place-items-center rounded-xl bg-[var(--ca-teal)] text-white shadow-md transition hover:opacity-90">
                    <i class="pi pi-camera text-sm"></i>
                    <input class="hidden" type="file" accept="image/jpeg,image/png,image/webp" (change)="selectAvatar($event)" />
                  </label>
                </div>

                <h2 class="mt-5 text-xl font-bold text-slate-800">{{ fullName() }}</h2>
                <p class="mt-1 text-sm text-slate-500">{{ item.email }}</p>
                <p class="mt-2.5 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-bold text-slate-600">
                  {{ item.aliasPublico ? '@' + item.aliasPublico : 'Alias pendiente' }}
                </p>

                <div class="mt-4 flex flex-wrap justify-center gap-1.5">
                  @for (role of item.roles; track role) {
                    <p-tag [value]="role" severity="secondary"></p-tag>
                  }
                </div>

                @if (selectedAvatar()) {
                  <div class="mt-4 w-full rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-left text-xs text-amber-900">
                    <p class="font-bold flex items-center gap-1.5"><i class="pi pi-exclamation-circle"></i> Imagen seleccionada</p>
                    <p class="mt-1 truncate text-slate-600">{{ selectedAvatar()?.name }}</p>
                  </div>
                }
              </div>
            </div>

            <!-- LEVEL & POINTS -->
            <div class="ca-panel bg-slate-50/70 p-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Puntos acumulados</span>
                  <strong class="mt-1.5 block text-4xl font-extrabold text-slate-800">{{ item.puntosTotales }}</strong>
                </div>
                <span class="grid h-10 w-10 place-items-center rounded-xl bg-[var(--ca-gold)]/10 text-[var(--ca-gold)]">
                  <i class="pi pi-star-fill text-lg"></i>
                </span>
              </div>
              <div class="mt-6">
                <div class="flex items-center justify-between gap-3 text-xs">
                  <span class="font-bold text-slate-700">{{ item.nombreNivelActual || item.codigoNivelActual || 'Nivel ciudadano' }}</span>
                  <span class="font-semibold text-[var(--ca-teal)]">{{ pointsToNextLevel() }}</span>
                </div>
                <div class="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-205 bg-slate-200">
                  <div class="h-full rounded-full bg-[var(--ca-teal)] transition-all duration-300" [style.width.%]="levelProgress()"></div>
                </div>
                <div class="mt-2 flex justify-between text-[11px] font-bold text-slate-400">
                  <span>{{ item.puntosMinimosNivel ?? 0 }} pts</span>
                  <span>{{ item.puntosMaximosNivel ?? item.puntosTotales }} pts</span>
                </div>
              </div>
            </div>
          </aside>

          <section class="space-y-6">
            <!-- PROFILE DATA FORM -->
            <div class="ca-panel p-6">
              <div class="border-b border-slate-100 pb-4 mb-6">
                <h2 class="text-lg font-bold text-slate-800">Datos del ciudadano</h2>
                <p class="mt-1 text-sm text-slate-500">Gestiona la información con la que interactúas en la plataforma.</p>
              </div>

              <form [formGroup]="form" class="space-y-6" (ngSubmit)="saveProfile()">
                <!-- Información pública -->
                <div class="space-y-4">
                  <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Información pública</h3>
                  <div class="grid gap-5 md:grid-cols-2">
                    <label class="block">
                      <span class="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Nombres</span>
                      <input pInputText class="w-full" formControlName="nombres" maxlength="100" />
                      @if (controlInvalid('nombres')) {
                        <small class="mt-1.5 block text-xs font-medium text-red-600">Ingresa tus nombres.</small>
                      }
                    </label>

                    <label class="block">
                      <span class="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Apellidos</span>
                      <input pInputText class="w-full" formControlName="apellidos" maxlength="100" />
                      @if (controlInvalid('apellidos')) {
                        <small class="mt-1.5 block text-xs font-medium text-red-600">Ingresa tus apellidos.</small>
                      }
                    </label>
                  </div>

                  <div class="grid gap-5 md:grid-cols-2">
                    <label class="block">
                      <span class="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Alias público (@)</span>
                      <span class="p-input-icon-left w-full block">
                        <i class="pi pi-at text-slate-400"></i>
                        <input pInputText class="w-full" formControlName="aliasPublico" maxlength="50" />
                      </span>
                      @if (controlInvalid('aliasPublico')) {
                        <small class="mt-1.5 block text-xs font-medium text-red-600">Usa de 3 a 50 caracteres (letras, números, puntos, guiones).</small>
                      } @else {
                        <small class="mt-1.5 block text-[11px] text-slate-400">Así aparecerás públicamente en tus reportes y comentarios.</small>
                      }
                    </label>
                  </div>
                </div>

                <!-- Datos de contacto (privados) -->
                <div class="space-y-4 pt-4 border-t border-slate-100">
                  <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Datos de contacto</h3>
                  <div class="grid gap-5 md:grid-cols-2">
                    <div class="block">
                      <span class="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Teléfono móvil</span>
                      
                      @if (item.telefonoVerificado) {
                        <!-- Teléfono Verificado -->
                        <div class="flex items-center gap-3">
                          <span class="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 flex items-center justify-between">
                            <span>{{ item.telefono }}</span>
                            <span class="flex items-center gap-1.5 text-xs font-bold text-[var(--ca-teal)]">
                              <i class="pi pi-verified"></i> Verificado
                            </span>
                          </span>
                          <button pButton type="button" severity="danger" outlined icon="pi pi-trash" tooltip="Desvincular teléfono" (click)="unlinkPhone()"></button>
                        </div>
                      } @else {
                        <!-- Teléfono No Verificado -->
                        <div class="flex flex-col gap-3">
                          <div class="flex gap-2">
                            <input pInputText class="w-full" formControlName="telefono" placeholder="Ej. 0998765432" maxlength="20" [disabled]="sendingOtp() || verifyingOtp()" />
                            @if (!showOtpInput()) {
                              <button pButton type="button" icon="pi pi-send" label="Verificar" [loading]="sendingOtp()" (click)="sendVerificationOtp()"></button>
                            }
                          </div>
                          @if (controlInvalid('telefono')) {
                            <small class="block text-xs font-medium text-red-600">Ingresa un número de celular válido de 9 o 10 dígitos (ej: 0998765432).</small>
                          }
                          
                          @if (showOtpInput()) {
                            <div class="mt-2 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                              <span class="block text-xs font-bold uppercase tracking-wider text-slate-500">Código de verificación (OTP)</span>
                              <div class="flex gap-2">
                                <input pInputText class="w-full" [(ngModel)]="otpCode" [ngModelOptions]="{standalone: true}" placeholder="Ingresa los 6 dígitos" maxlength="6" />
                                <button pButton type="button" icon="pi pi-check" label="Confirmar" [loading]="verifyingOtp()" (click)="confirmVerificationOtp()"></button>
                              </div>
                              <div class="flex justify-between items-center text-xs">
                                <button pButton type="button" class="p-button-text p-0 text-slate-500" label="Cambiar número" (click)="cancelOtp()"></button>
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>
                
                <!-- Contenedor invisible para reCAPTCHA de Firebase -->
                <div id="recaptcha-container" class="hidden"></div>

                <!-- Botones de acción -->
                <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button pButton type="button" severity="secondary" outlined icon="pi pi-refresh" label="Restaurar" (click)="resetForm()" [disabled]="saving()"></button>
                  <button pButton type="submit" icon="pi pi-save" label="Guardar cambios" [loading]="saving()"></button>
                </div>
              </form>
            </div>

            <!-- POINTS MOVEMENTS -->
            <div class="ca-panel p-6">
              <div class="flex flex-col gap-3 border-b border-slate-100 pb-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="text-lg font-bold text-slate-800">Movimientos de puntos</h2>
                  <p class="mt-1 text-sm text-slate-500">Historial reciente de tu actividad ciudadana.</p>
                </div>
                <button pButton size="small" severity="secondary" outlined icon="pi pi-refresh" label="Actualizar" (click)="loadMovements()" [loading]="loadingMovements()" class="hover:bg-slate-50"></button>
              </div>

              @if (loadingMovements()) {
                <div class="grid gap-3">
                  <div class="h-16 rounded-xl bg-slate-50 animate-pulse border border-slate-100"></div>
                  <div class="h-16 rounded-xl bg-slate-50 animate-pulse border border-slate-100"></div>
                </div>
              } @else if (movementsError()) {
                <div class="rounded-xl bg-red-50/50 border border-red-100 p-6 text-center">
                  <i class="pi pi-cloud-off text-xl text-red-500"></i>
                  <p class="mt-2 font-bold text-red-800">Error al cargar movimientos</p>
                  <p class="mt-0.5 text-xs text-red-600">No pudimos obtener la lista. Por favor intenta de nuevo.</p>
                </div>
              } @else if (movements().length === 0) {
                <div class="rounded-xl bg-slate-50/50 border border-slate-100 p-6 text-center">
                  <i class="pi pi-sparkles text-xl text-slate-400"></i>
                  <p class="mt-2 font-bold text-slate-700">Sin movimientos aún</p>
                  <p class="mt-0.5 text-xs text-slate-500">Cuando reportes, comentes o valides incidencias obtendrás puntos aquí.</p>
                </div>
              } @else {
                <div class="grid gap-3">
                  @for (movement of movements(); track movement.idMovimiento) {
                    <article class="flex items-center gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                      <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--ca-teal)]/10 text-[var(--ca-teal)]">
                        <i class="pi pi-check-circle text-sm"></i>
                      </span>
                      <div class="min-w-0 flex-1">
                        <h3 class="truncate text-sm font-bold text-slate-800">{{ movement.nombreAccion || 'Movimiento' }}</h3>
                        <p class="mt-0.5 truncate text-xs text-slate-500">
                          {{ movement.tituloIncidencia || movement.motivo || 'Actividad ciudadana' }}
                        </p>
                        <p class="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ movement.creadoEn | date:'dd MMM, HH:mm' }}</p>
                      </div>
                      <strong class="shrink-0 text-sm font-bold" [class.text-[var(--ca-teal)]]="movement.puntos >= 0" [class.text-red-600]="movement.puntos < 0">
                        {{ movement.puntos >= 0 ? '+' : '' }}{{ movement.puntos }} pts
                      </strong>
                    </article>
                  }
                </div>
              }
            </div>
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

  readonly sendingOtp = signal(false);
  readonly verifyingOtp = signal(false);
  readonly showOtpInput = signal(false);
  otpCode = '';
  private recaptchaVerifier: any = null;
  private confirmationResult: any = null;

  readonly form = this.fb.nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    aliasPublico: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
    telefono: ['', [Validators.pattern(/^0?9[0-9]{8}$/), Validators.maxLength(20)]],
  });

  ngOnInit() {
    this.resetForm();
    this.loadMovements();
  }

  ngOnDestroy() {
    this.revokePreview();
    this.cancelOtp();
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
    this.cancelOtp();
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
          telefono: currentUser.telefono,
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

  private normalizarTelefono(raw: string): string {
    let clean = raw.replace(/\D/g, '');
    if (clean.startsWith('593')) {
      return '+' + clean;
    }
    if (clean.startsWith('0')) {
      clean = clean.substring(1);
    }
    return '+593' + clean;
  }

  async sendVerificationOtp() {
    const rawPhone = this.form.controls.telefono.value;
    if (!rawPhone || rawPhone.trim().length < 9) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Número no válido',
        detail: 'Por favor ingresa un número de celular válido de 9 o 10 dígitos (ej: 0998765432).',
      });
      return;
    }

    const normalizedPhone = this.normalizarTelefono(rawPhone);
    this.sendingOtp.set(true);

    try {
      await firstValueFrom(this.profileService.checkPhoneAvailability(normalizedPhone));

      if (!this.recaptchaVerifier) {
        this.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
          size: 'invisible',
        });
      }

      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        throw new Error('No hay una sesión activa de Firebase.');
      }

      this.confirmationResult = await linkWithPhoneNumber(
        currentUser,
        normalizedPhone,
        this.recaptchaVerifier
      );

      this.showOtpInput.set(true);
      this.otpCode = '';
      this.messageService.add({
        severity: 'info',
        summary: 'Código enviado',
        detail: 'Hemos enviado un código SMS de verificación a tu celular.',
      });
    } catch (error: any) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.messageService.add({
          severity: 'error',
          summary: 'Número en uso',
          detail: 'Este número celular ya está verificado por otra cuenta.',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al enviar SMS',
          detail: this.errorMessage(error, 'Ocurrió un error al enviar el código. Revisa el número e intenta de nuevo.'),
        });
      }
      this.recaptchaVerifier?.clear();
      this.recaptchaVerifier = null;
    } finally {
      this.sendingOtp.set(false);
    }
  }

  async confirmVerificationOtp() {
    if (!this.otpCode || this.otpCode.length !== 6) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Código no válido',
        detail: 'Ingresa el código de 6 dígitos que recibiste por SMS.',
      });
      return;
    }

    this.verifyingOtp.set(true);
    try {
      await this.confirmationResult.confirm(this.otpCode);
      await firstValueFrom(this.profileService.syncPhone());
      await this.session.loadCurrentUser();

      this.showOtpInput.set(false);
      this.otpCode = '';
      this.recaptchaVerifier?.clear();
      this.recaptchaVerifier = null;
      this.confirmationResult = null;

      this.resetForm();

      this.messageService.add({
        severity: 'success',
        summary: 'Celular verificado',
        detail: 'Tu número celular ha sido verificado y guardado con éxito.',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de verificación',
        detail: this.errorMessage(error, 'El código ingresado es incorrecto o expiró.'),
      });
    } finally {
      this.verifyingOtp.set(false);
    }
  }

  cancelOtp() {
    this.showOtpInput.set(false);
    this.otpCode = '';
    this.recaptchaVerifier?.clear();
    this.recaptchaVerifier = null;
    this.confirmationResult = null;
  }

  async unlinkPhone() {
    const user = firebaseAuth.currentUser;
    if (!user) return;

    this.saving.set(true);
    try {
      const phoneProvider = user.providerData.find(p => p.providerId === PhoneAuthProvider.PROVIDER_ID);
      if (phoneProvider) {
        await unlink(user, PhoneAuthProvider.PROVIDER_ID);
      }

      await firstValueFrom(
        this.profileService.updateProfile({
          nombres: this.form.controls.nombres.value,
          apellidos: this.form.controls.apellidos.value,
          aliasPublico: this.form.controls.aliasPublico.value,
          telefono: null,
          fotoPerfilUrl: this.user()?.fotoPerfilUrl,
        })
      );

      await this.session.loadCurrentUser();
      this.resetForm();
      this.messageService.add({
        severity: 'success',
        summary: 'Celular desvinculado',
        detail: 'El número celular ha sido desvinculado de tu cuenta.',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: this.errorMessage(error, 'No se pudo desvincular el celular.'),
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
