import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { authErrorMessage } from '../../../core/auth/auth-error.util';
import { AuthSessionService } from '../../../core/auth/auth-session.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, CardModule, InputTextModule, MessageModule],
  template: `
    <main class="ca-auth-page">
      <div class="ca-auth-grid">

        <aside class="ca-auth-aside">
          <div class="relative">
            <a routerLink="/" class="flex items-center gap-4 hover:opacity-90 transition-opacity">
              <img src="/logo/icon_only_white.png" class="h-14 w-14 object-contain" alt="CA Logo" />
              <div>
                <p class="text-xl font-black tracking-tight text-white">CuencaActiva</p>
                <p class="text-sm text-slate-300">Recuperación de acceso</p>
              </div>
            </a>

            <div class="mt-24 max-w-md">
              <p class="ca-kicker text-[var(--ca-gold)]">Contraseña</p>
              <h1 class="mt-5 text-4xl font-black leading-tight tracking-tight xl:text-5xl">Recupera el acceso a tu cuenta.</h1>
              <p class="mt-6 text-base leading-8 text-slate-300">Te enviaremos un enlace a tu correo electrónico para que puedas crear una nueva contraseña de forma segura.</p>
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
          <div class="ca-auth-card w-full max-w-[440px]">
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
              <p class="ca-kicker text-[var(--ca-gold)]">Recuperar contraseña</p>
              <h2 class="mt-4 text-4xl font-black tracking-tight text-[var(--ca-navy)]">Restablecer</h2>
              <p class="mt-4 text-base leading-7 text-slate-600">Te enviaremos un enlace a tu correo para crear una nueva contraseña.</p>
            </div>

            @if (successMessage()) {
              <p-message class="mb-5 block" severity="success" [text]="successMessage()"></p-message>
            }
            @if (errorMessage()) {
              <p-message class="mb-5 block" severity="error" [text]="errorMessage()"></p-message>
            }

            <form class="space-y-5" [formGroup]="form" (ngSubmit)="submit()">
              <label class="block">
                <span class="mb-2 block text-sm font-bold text-slate-700">Correo electrónico</span>
                <span class="p-input-icon-left w-full">
                  <i class="pi pi-envelope text-slate-400"></i>
                  <input pInputText class="h-12 w-full" type="email" formControlName="email" autocomplete="email" placeholder="usuario@correo.com" />
                </span>
              </label>

              <button
                pButton
                class="h-12 w-full justify-center border-0 text-base font-bold"
                type="submit"
                icon="pi pi-send"
                label="Enviar enlace"
                [loading]="loading()"
                [disabled]="form.invalid || loading()"
              ></button>
            </form>

            <div class="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
              <a routerLink="/login" class="font-semibold text-[var(--ca-teal)]">Volver al inicio de sesión</a>
              <a routerLink="/registro" class="font-semibold text-slate-500">Crear cuenta</a>
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
export class ForgotPasswordPageComponent {
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly session: AuthSessionService,
  ) {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async submit() {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    try {
      const email = this.form.controls.email.value;
      await this.session.sendPasswordReset(email);
      this.successMessage.set(`Enviamos instrucciones a ${email}. Revisa tu bandeja de entrada.`);
    } catch (error) {
      this.errorMessage.set(authErrorMessage(error, 'No se pudo enviar el enlace. Verifica el correo e intenta nuevamente.'));
    } finally {
      this.loading.set(false);
    }
  }
}
