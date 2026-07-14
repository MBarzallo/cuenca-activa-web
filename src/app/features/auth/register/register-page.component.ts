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
    <main class="ca-auth-page">
      <div class="ca-auth-grid">

        <aside class="ca-auth-aside">
          <div class="relative">
            <a routerLink="/" class="flex items-center gap-4 hover:opacity-90 transition-opacity">
              <img src="/logo/icon_only_white.png" class="h-14 w-14 object-contain" alt="CA Logo" />
              <div>
                <p class="text-xl font-black tracking-tight text-white">CuencaActiva</p>
                <p class="text-sm text-slate-300">Ciudadanía en acción</p>
              </div>
            </a>

            <div class="mt-24 max-w-md">
              <p class="ca-kicker text-[var(--ca-teal)]">Nueva cuenta</p>
              <h1 class="mt-5 text-4xl font-black leading-tight tracking-tight xl:text-5xl">Participa con una cuenta ciudadana.</h1>
              <p class="mt-6 text-base leading-8 text-slate-300">Crea tu perfil para reportar incidencias, comentar, validar información y seguir el avance de tus reportes.</p>
            </div>
          </div>

          <div class="relative grid gap-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="ca-auth-benefit">
                <div class="ca-auth-benefit-icon bg-[var(--ca-teal)]/20 text-[var(--ca-teal)]">
                  <i class="pi pi-map-marker"></i>
                </div>
                <p class="text-sm font-bold">Reportes cercanos</p>
                <p class="mt-2 text-xs leading-5 text-slate-300">
                  Consulta incidencias visibles en el mapa ciudadano.
                </p>
              </div>

              <div class="ca-auth-benefit">
                <div class="ca-auth-benefit-icon bg-[var(--ca-gold)]/20 text-[var(--ca-gold)]">
                  <i class="pi pi-comments"></i>
                </div>
                <p class="text-sm font-bold">Participación útil</p>
                <p class="mt-2 text-xs leading-5 text-slate-300">
                  Valida reportes, comenta y aporta información.
                </p>
              </div>
            </div>

            <div class="ca-auth-benefit">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-bold text-white">Plataforma comunitaria</p>
                  <p class="mt-1 text-xs text-slate-300">
                    Información clara para mejorar la ciudad.
                  </p>
                </div>

                <div class="grid h-12 w-12 place-items-center rounded-[var(--ca-radius)] bg-white text-[var(--ca-navy)]">
                  <i class="pi pi-shield"></i>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section class="flex min-h-[100dvh] items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-16">
          <div class="ca-auth-card w-full max-w-[580px]">
            <div class="mb-10 lg:hidden">
              <a routerLink="/" class="flex items-center gap-4 hover:opacity-90 transition-opacity">
                <img src="/logo/icon_only.png" class="h-14 w-14 object-contain" alt="CA Logo" />

                <div>
                  <p class="text-xl font-black text-[var(--ca-navy)]">CuencaActiva</p>
                  <p class="text-sm text-slate-500">Gestión ciudadana</p>
                </div>
              </a>
            </div>

            <div class="mb-8">
              <p class="ca-kicker">Registro ciudadano</p>
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
                  <input pInputText class="h-12 w-full" formControlName="nombres" maxlength="100" autocomplete="given-name" />
                  @if (controlInvalid('nombres')) {
                    <small class="mt-2 block text-red-600">Ingresa tus nombres.</small>
                  }
                </label>
                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-slate-700">Apellidos</span>
                  <input pInputText class="h-12 w-full" formControlName="apellidos" maxlength="100" autocomplete="family-name" />
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
                    <input pInputText class="h-12 w-full" formControlName="aliasPublico" maxlength="50" autocomplete="nickname" />
                  </span>
                  @if (controlInvalid('aliasPublico')) {
                    <small class="mt-2 block text-red-600">Usa 3 a 50 caracteres: letras, números, puntos, guiones o guion bajo.</small>
                  }
                </label>
                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-slate-700">Teléfono</span>
                  <input pInputText class="h-12 w-full" formControlName="telefono" maxlength="20" autocomplete="tel" />
                </label>
              </div>

              <label class="block">
                <span class="mb-2 block text-sm font-bold text-slate-700">Correo electrónico</span>
                <span class="p-input-icon-left w-full">
                  <i class="pi pi-envelope text-slate-400"></i>
                  <input pInputText class="h-12 w-full" type="email" formControlName="email" autocomplete="email" placeholder="usuario@correo.com" />
                </span>
                @if (controlInvalid('email')) {
                  <small class="mt-2 block text-red-600">Ingresa un correo válido.</small>
                }
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-bold text-slate-700">Contraseña</span>
                <p-password
                  styleClass="w-full"
                  inputStyleClass="h-12 w-full"
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
                class="mt-2 h-12 w-full justify-center border-0 text-base font-bold"
                type="submit"
                icon="pi pi-user-plus"
                label="Crear cuenta"
                [loading]="loading()"
                [disabled]="form.invalid || loading()"
              ></button>
            </form>

            <div class="mt-6 rounded-[var(--ca-radius-lg)] border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              ¿Ya tienes cuenta?
              <a routerLink="/login" class="font-semibold text-[var(--ca-teal)]">Inicia sesión</a>
            </div>
            <div class="mt-6 text-center">
              <a routerLink="/" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
                <i class="pi pi-arrow-left text-xs"></i>
                Volver al inicio público
              </a>
            </div>
          </div>
        </section>

      </div>
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
