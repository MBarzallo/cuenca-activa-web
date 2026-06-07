import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { authErrorMessage } from '../../../core/auth/auth-error.util';
import { AuthSessionService } from '../../../core/auth/auth-session.service';

@Component({
  selector: 'app-complete-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, MessageModule],
  template: `
    <main class="min-h-screen bg-[var(--ca-bg)] px-4 py-6 sm:px-8">
      <section class="mx-auto grid min-h-[calc(100vh-48px)] max-w-5xl place-items-center">
        <div class="w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] lg:grid lg:grid-cols-[0.85fr_1.15fr]">
          <aside class="relative overflow-hidden bg-[var(--ca-navy)] p-7 text-white sm:p-9 lg:p-10">
            <div class="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--ca-teal)]/25 blur-3xl"></div>
            <div class="absolute -bottom-24 left-6 h-56 w-56 rounded-full bg-[var(--ca-gold)]/20 blur-3xl"></div>
            <div class="relative">
              <div class="flex items-center gap-4">
                <span class="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--ca-gold)] text-lg font-black text-[var(--ca-navy)]">CA</span>
                <div>
                  <p class="text-xl font-black">CuencaActiva</p>
                  <p class="text-sm text-slate-300">Perfil ciudadano</p>
                </div>
              </div>
              <h1 class="mt-10 text-4xl font-black leading-tight">Completa tu perfil para participar.</h1>
              <p class="mt-4 max-w-md leading-7 text-slate-300">
                Ya validamos tu acceso. Solo faltan tus datos ciudadanos para mostrarte tu cuenta, reportes y participación.
              </p>
            </div>
          </aside>

          <section class="p-6 sm:p-9 lg:p-12">
            <div class="mb-8">
              <p class="text-sm font-black uppercase tracking-[0.22em] text-[var(--ca-teal)]">Un paso más</p>
              <h2 class="mt-3 text-3xl font-black text-[var(--ca-navy)]">Datos de perfil</h2>
              <p class="mt-3 text-sm leading-6 text-slate-600">Estos datos ayudan a identificar tu participación dentro de la plataforma.</p>
            </div>

            @if (errorMessage()) {
              <p-message class="mb-5 block" severity="error" [text]="errorMessage()"></p-message>
            }

            <form class="grid gap-5" [formGroup]="form" (ngSubmit)="submit()">
              <div class="grid gap-5 md:grid-cols-2">
                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-slate-700">Nombres</span>
                  <input pInputText class="h-12 w-full rounded-2xl" formControlName="nombres" maxlength="100" autocomplete="given-name" />
                </label>
                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-slate-700">Apellidos</span>
                  <input pInputText class="h-12 w-full rounded-2xl" formControlName="apellidos" maxlength="100" autocomplete="family-name" />
                </label>
              </div>

              <div class="grid gap-5 md:grid-cols-2">
                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-slate-700">Alias público</span>
                  <span class="p-input-icon-left w-full">
                    <i class="pi pi-at text-slate-400"></i>
                    <input pInputText class="h-12 w-full rounded-2xl" formControlName="aliasPublico" maxlength="50" autocomplete="nickname" />
                  </span>
                </label>
                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-slate-700">Teléfono</span>
                  <input pInputText class="h-12 w-full rounded-2xl" formControlName="telefono" maxlength="20" autocomplete="tel" />
                </label>
              </div>

              <button
                pButton
                class="h-12 w-full justify-center rounded-2xl border-0 bg-[var(--ca-teal)] text-base font-bold text-white"
                type="submit"
                icon="pi pi-check-circle"
                label="Completar perfil"
                [loading]="loading()"
                [disabled]="form.invalid || loading()"
              ></button>
            </form>

            <a routerLink="/login" class="mt-6 inline-block text-sm font-semibold text-slate-500">Usar otra cuenta</a>
          </section>
        </div>
      </section>
    </main>
  `,
})
export class CompleteProfilePageComponent implements OnInit {
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
    });
  }

  async ngOnInit() {
    if (!(await this.session.hasFirebaseSession())) {
      await this.router.navigateByUrl('/login');
      return;
    }

    try {
      const user = await this.session.loadCurrentUser();
      if (user) {
        await this.router.navigateByUrl('/');
      }
    } catch (error) {
      if (!this.session.isMissingProfileError(error)) {
        this.errorMessage.set(authErrorMessage(error, 'No se pudo revisar tu perfil. Intenta nuevamente.'));
      }
    }
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    try {
      await this.session.completeInternalProfile(this.form.getRawValue());
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.errorMessage.set(authErrorMessage(error, 'No se pudo completar el perfil. Revisa los datos e intenta nuevamente.'));
    } finally {
      this.loading.set(false);
    }
  }
}
