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
    <main class="min-h-screen bg-[var(--ca-bg)] px-4 py-6 sm:px-8">
      <section class="mx-auto grid min-h-[calc(100vh-48px)] max-w-5xl place-items-center">
        <div class="w-full max-w-xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
          <div class="bg-[var(--ca-navy)] p-7 text-white sm:p-9">
            <div class="flex items-center gap-4">
              <span class="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--ca-gold)] text-lg font-black text-[var(--ca-navy)]">CA</span>
              <div>
                <p class="text-xl font-black">CuencaActiva</p>
                <p class="text-sm text-slate-300">Recuperación de acceso</p>
              </div>
            </div>
            <h1 class="mt-8 text-3xl font-black">Recuperar contraseña</h1>
            <p class="mt-3 leading-7 text-slate-300">Te enviaremos un enlace a tu correo para crear una nueva contraseña.</p>
          </div>

          <div class="p-6 sm:p-9">
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
                  <input pInputText class="h-12 w-full rounded-2xl" type="email" formControlName="email" autocomplete="email" placeholder="usuario@correo.com" />
                </span>
              </label>

              <button
                pButton
                class="h-12 w-full justify-center rounded-2xl border-0 bg-[var(--ca-teal)] text-base font-bold text-white"
                type="submit"
                icon="pi pi-send"
                label="Enviar enlace"
                [loading]="loading()"
                [disabled]="form.invalid || loading()"
              ></button>
            </form>

            <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
              <a routerLink="/login" class="font-semibold text-[var(--ca-teal)]">Volver al inicio de sesión</a>
              <a routerLink="/registro" class="text-sm font-semibold text-slate-500">Crear cuenta</a>
            </div>
          </div>
        </div>
      </section>
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
