import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { authErrorMessage } from '../../../core/auth/auth-error.util';
import { AuthSessionService } from '../../../core/auth/auth-session.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, CardModule, InputTextModule, PasswordModule, MessageModule],
  template: `
    <main class="min-h-screen bg-[var(--ca-bg)] px-4 py-6 sm:px-8">
      <section class="mx-auto flex min-h-[calc(100vh-48px)] max-w-6xl items-center justify-center">
        <div class="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] lg:grid-cols-[0.9fr_1.1fr]">
          <aside class="relative hidden overflow-hidden bg-[var(--ca-navy)] p-10 text-white lg:flex lg:min-h-[720px] lg:flex-col lg:justify-between">
            <div class="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--ca-teal)]/25 blur-3xl"></div>
            <div class="absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-[var(--ca-gold)]/20 blur-3xl"></div>

            <div class="relative">
              <div class="flex items-center gap-4">
                <div class="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--ca-gold)] text-lg font-black text-[var(--ca-navy)]">CA</div>
                <div>
                  <p class="text-xl font-black tracking-tight">CuencaActiva</p>
                  <p class="text-sm text-slate-300">Ciudadanía en acción</p>
                </div>
              </div>

              <div class="mt-20 max-w-md">
                <p class="text-sm font-bold uppercase tracking-[0.28em] text-[var(--ca-teal)]">Nueva cuenta</p>
                <h1 class="mt-5 text-5xl font-black leading-[1.05] tracking-tight">Participa con una cuenta ciudadana.</h1>
                <p class="mt-6 text-base leading-8 text-slate-300">Crea tu perfil para reportar incidencias, comentar, validar información y seguir el avance de tus reportes.</p>
              </div>
            </div>

            <div class="relative rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p class="text-sm font-bold">Tu ciudad, más cerca de ti.</p>
              <p class="mt-2 text-xs leading-5 text-slate-300">Usa datos claros y una ubicación útil para ayudar a mejorar Cuenca.</p>
            </div>
          </aside>

          <section class="flex min-h-[720px] items-center justify-center p-6 sm:p-10 lg:p-14">
            <div class="w-full max-w-2xl">
              <div class="mb-8">
                <p class="text-sm font-black uppercase tracking-[0.24em] text-[var(--ca-teal)]">Registro ciudadano</p>
                <h2 class="mt-4 text-4xl font-black tracking-tight text-[var(--ca-navy)]">Crear cuenta</h2>
                <p class="mt-4 text-base leading-7 text-slate-600">Completa tus datos para empezar a participar en CuencaActiva.</p>
              </div>

              @if (errorMessage()) {
                <p-message class="mb-5 block" severity="error" [text]="errorMessage()"></p-message>
              }

              <form class="grid gap-5" [formGroup]="form" (ngSubmit)="submit()">
                <div class="grid gap-5 md:grid-cols-2">
                  <label class="block">
                    <span class="mb-2 block text-sm font-bold text-slate-700">Nombres</span>
                    <input pInputText class="h-12 w-full rounded-2xl" formControlName="nombres" maxlength="100" autocomplete="given-name" />
                    @if (controlInvalid('nombres')) {
                      <small class="mt-2 block text-red-600">Ingresa tus nombres.</small>
                    }
                  </label>
                  <label class="block">
                    <span class="mb-2 block text-sm font-bold text-slate-700">Apellidos</span>
                    <input pInputText class="h-12 w-full rounded-2xl" formControlName="apellidos" maxlength="100" autocomplete="family-name" />
                    @if (controlInvalid('apellidos')) {
                      <small class="mt-2 block text-red-600">Ingresa tus apellidos.</small>
                    }
                  </label>
                </div>

                <div class="grid gap-5 md:grid-cols-2">
                  <label class="block">
                    <span class="mb-2 block text-sm font-bold text-slate-700">Alias público</span>
                    <span class="p-input-icon-left w-full">
                      <i class="pi pi-at text-slate-400"></i>
                      <input pInputText class="h-12 w-full rounded-2xl" formControlName="aliasPublico" maxlength="50" autocomplete="nickname" />
                    </span>
                    @if (controlInvalid('aliasPublico')) {
                      <small class="mt-2 block text-red-600">Usa 3 a 50 caracteres: letras, números, puntos, guiones o guion bajo.</small>
                    }
                  </label>
                  <label class="block">
                    <span class="mb-2 block text-sm font-bold text-slate-700">Teléfono</span>
                    <input pInputText class="h-12 w-full rounded-2xl" formControlName="telefono" maxlength="20" autocomplete="tel" />
                  </label>
                </div>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-slate-700">Correo electrónico</span>
                  <span class="p-input-icon-left w-full">
                    <i class="pi pi-envelope text-slate-400"></i>
                    <input pInputText class="h-12 w-full rounded-2xl" type="email" formControlName="email" autocomplete="email" placeholder="usuario@correo.com" />
                  </span>
                  @if (controlInvalid('email')) {
                    <small class="mt-2 block text-red-600">Ingresa un correo válido.</small>
                  }
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-slate-700">Contraseña</span>
                  <p-password
                    styleClass="w-full"
                    inputStyleClass="h-12 w-full rounded-2xl"
                    formControlName="password"
                    [feedback]="false"
                    [toggleMask]="true"
                    placeholder="Mínimo 6 caracteres"
                  ></p-password>
                  @if (controlInvalid('password')) {
                    <small class="mt-2 block text-red-600">Usa al menos 6 caracteres.</small>
                  }
                </label>

                <button
                  pButton
                  class="mt-2 h-12 w-full justify-center rounded-2xl border-0 bg-[var(--ca-teal)] text-base font-bold text-white"
                  type="submit"
                  icon="pi pi-user-plus"
                  label="Crear cuenta"
                  [loading]="loading()"
                  [disabled]="form.invalid || loading()"
                ></button>
              </form>

              <div class="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                ¿Ya tienes cuenta?
                <a routerLink="/login" class="font-semibold text-[var(--ca-teal)]">Inicia sesión</a>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  `,
})
export class RegisterPageComponent {
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly session: AuthSessionService,
    private readonly router: Router,
  ) {
    this.form = this.fb.nonNullable.group({
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.maxLength(100)]],
      aliasPublico: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
      telefono: ['', Validators.maxLength(20)],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  controlInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const value = this.form.getRawValue();
      await this.session.register(value);
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.errorMessage.set(authErrorMessage(error, 'No se pudo crear la cuenta. Revisa los datos e intenta nuevamente.'));
    } finally {
      this.loading.set(false);
    }
  }
}
