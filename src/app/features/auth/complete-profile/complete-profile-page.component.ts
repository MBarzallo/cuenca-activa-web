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
    <main class="min-h-screen w-full bg-white">
      <div class="grid min-h-screen w-full lg:grid-cols-2">

        <!-- Panel visual (Left) -->
        <aside class="relative hidden flex-col justify-between overflow-hidden bg-[var(--ca-navy)] p-12 text-white lg:flex">
          <div class="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--ca-teal)]/25 blur-3xl"></div>
          <div class="absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-[var(--ca-gold)]/20 blur-3xl"></div>

          <!-- Header / Logo -->
          <div class="relative">
            <a routerLink="/" class="flex items-center gap-4 hover:opacity-90 transition-opacity">
              <img src="/logo/icon_only_white.png" class="h-14 w-14 object-contain" alt="CA Logo" />
              <div>
                <p class="text-xl font-black tracking-tight text-white">CuencaActiva</p>
                <p class="text-sm text-slate-300">Perfil ciudadano</p>
              </div>
            </a>

            <div class="mt-24 max-w-md">
              <p class="text-sm font-bold uppercase tracking-[0.28em] text-[var(--ca-teal)]">Un paso más</p>
              <h1 class="mt-5 text-4xl font-black leading-tight tracking-tight xl:text-5xl">Completa tu perfil para participar.</h1>
              <p class="mt-6 text-base leading-8 text-slate-300">Ya validamos tu acceso. Solo faltan tus datos ciudadanos para mostrarte tu cuenta, reportes y participación.</p>
            </div>
          </div>

          <!-- Beneficios -->
          <div class="relative grid gap-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div class="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-[var(--ca-teal)]/20 text-[var(--ca-teal)]">
                  <i class="pi pi-map-marker"></i>
                </div>
                <p class="text-sm font-bold">Reportes cercanos</p>
                <p class="mt-2 text-xs leading-5 text-slate-300">
                  Consulta incidencias visibles en el mapa ciudadano.
                </p>
              </div>

              <div class="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div class="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-[var(--ca-gold)]/20 text-[var(--ca-gold)]">
                  <i class="pi pi-comments"></i>
                </div>
                <p class="text-sm font-bold">Participación útil</p>
                <p class="mt-2 text-xs leading-5 text-slate-300">
                  Valida reportes, comenta y aporta información.
                </p>
              </div>
            </div>

            <div class="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-bold text-white">Plataforma comunitaria</p>
                  <p class="mt-1 text-xs text-slate-300">
                    Información clara para mejorar la ciudad.
                  </p>
                </div>

                <div class="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[var(--ca-navy)]">
                  <i class="pi pi-shield"></i>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Formulario (Right) -->
        <section class="flex min-h-screen items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-16">
          <div class="w-full max-w-[560px]">
            <!-- Header móvil -->
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
                class="h-12 w-full justify-center rounded-2xl border-0 bg-[var(--ca-teal)] text-base font-bold text-white hover:bg-[#0f9f91]"
                type="submit"
                icon="pi pi-check-circle"
                label="Completar perfil"
                [loading]="loading()"
                [disabled]="form.invalid || loading()"
              ></button>
            </form>

            <div class="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
              <a routerLink="/login" class="font-semibold text-slate-500 hover:text-slate-700">Usar otra cuenta</a>
              <a routerLink="/" class="inline-flex items-center gap-2 font-semibold text-slate-500 hover:text-slate-700 transition-colors">
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
      telefono: ['', [Validators.pattern(/^0?9[0-9]{8}$/), Validators.maxLength(20)]],
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
