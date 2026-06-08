import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { authErrorMessage } from '../../../core/auth/auth-error.util';
import { AuthSessionService } from '../../../core/auth/auth-session.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, CardModule, InputTextModule, PasswordModule, MessageModule],
  template: `
    <main class="min-h-screen w-full bg-white">
      <div class="grid min-h-screen w-full lg:grid-cols-2">

        <!-- Panel visual (Left) -->
        <aside class="relative hidden flex-col justify-between overflow-hidden bg-[#0F172A] p-12 text-white lg:flex">
          <div class="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#14B8A6]/25 blur-3xl"></div>
          <div class="absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-[#D4A937]/20 blur-3xl"></div>

          <!-- Header / Logo -->
          <div class="relative">
            <a routerLink="/" class="flex items-center gap-4 hover:opacity-90 transition-opacity">
              <img src="/logo/icon_only_white.png" class="h-14 w-14 object-contain" alt="CA Logo" />
              <div>
                <p class="text-xl font-black tracking-tight text-white">CuencaActiva</p>
                <p class="text-sm text-slate-300">Gestión ciudadana inteligente</p>
              </div>
            </a>

            <div class="mt-24 max-w-md">
              <p class="text-sm font-bold uppercase tracking-[0.28em] text-[#14B8A6]">
                Acceso ciudadano
              </p>

              <h1 class="mt-5 text-4xl font-black leading-tight tracking-tight xl:text-5xl">
                Conoce, reporta y da seguimiento a lo que ocurre en Cuenca.
              </h1>

              <p class="mt-6 text-base leading-8 text-slate-300">
                Ingresa para revisar tu perfil, consultar tus reportes y participar en el seguimiento de incidencias urbanas.
              </p>
            </div>
          </div>

          <!-- Beneficios -->
          <div class="relative grid gap-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div class="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-[#14B8A6]/20 text-[#14B8A6]">
                  <i class="pi pi-map-marker"></i>
                </div>
                <p class="text-sm font-bold">Reportes cercanos</p>
                <p class="mt-2 text-xs leading-5 text-slate-300">
                  Consulta incidencias visibles en el mapa ciudadano.
                </p>
              </div>

              <div class="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div class="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-[#D4A937]/20 text-[#D4A937]">
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

                <div class="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#0F172A]">
                  <i class="pi pi-shield"></i>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Formulario (Right) -->
        <section class="flex min-h-screen items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-16">
          <div class="w-full max-w-[420px]">
            <!-- Header móvil -->
            <div class="mb-10 lg:hidden">
              <a routerLink="/" class="flex items-center gap-4 hover:opacity-90 transition-opacity">
                <img src="/logo/icon_only.png" class="h-14 w-14 object-contain" alt="CA Logo" />

                <div>
                  <p class="text-xl font-black text-[#0F172A]">CuencaActiva</p>
                  <p class="text-sm text-slate-500">Gestión ciudadana</p>
                </div>
              </a>
            </div>

            <div class="mb-8">
              <p class="text-sm font-black uppercase tracking-[0.24em] text-[#14B8A6]">
                Iniciar sesión
              </p>

              <h2 class="mt-4 text-4xl font-black tracking-tight text-[#0F172A]">
                Entra a tu cuenta
              </h2>

              <p class="mt-4 text-base leading-7 text-slate-600">
                Usa tu correo y contraseña para acceder a CuencaActiva.
              </p>
            </div>

            @if (errorMessage()) {
              <p-message
                class="mb-5 block"
                severity="error"
                [text]="errorMessage()">
              </p-message>
            }

            <form class="space-y-5" [formGroup]="form" (ngSubmit)="submit()">
              <label class="block">
                <span class="mb-2 block text-sm font-bold text-slate-700">
                  Correo electrónico
                </span>

                <span class="p-input-icon-left w-full">
                  <i class="pi pi-envelope text-slate-400"></i>
                  <input
                    pInputText
                    class="h-12 w-full rounded-2xl"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    placeholder="usuario@correo.com" />
                </span>
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-bold text-slate-700">
                  Contraseña
                </span>

                <p-password
                  styleClass="w-full"
                  inputStyleClass="h-12 w-full rounded-2xl"
                  formControlName="password"
                  [feedback]="false"
                  [toggleMask]="true"
                  placeholder="Ingresa tu contraseña">
                </p-password>
                <a routerLink="/recuperar-contrasena" class="mt-2 inline-block text-sm font-semibold text-[#14B8A6]">
                  ¿Olvidaste tu contraseña?
                </a>
              </label>

              <button
                pButton
                class="mt-2 h-12 w-full justify-center rounded-2xl border-0 bg-[#14B8A6] text-base font-bold text-white hover:bg-[#0F9F91]"
                type="submit"
                icon="pi pi-sign-in"
                label="Ingresar"
                [loading]="loading()"
                [disabled]="form.invalid || loading()">
              </button>
            </form>

            <div class="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div class="flex gap-3">
                <div class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#D4A937]/15 text-[#D4A937]">
                  <i class="pi pi-info-circle"></i>
                </div>

                <div>
                  <p class="text-sm font-bold text-[#0F172A]">
                    Acceso web
                  </p>
                  <p class="mt-1 text-sm leading-6 text-slate-600">
                    Usa la misma cuenta registrada en CuencaActiva. El acceso administrativo depende de tus roles.
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-5 text-center text-sm text-slate-600">
              ¿Aún no tienes cuenta?
              <a routerLink="/registro" class="font-semibold text-[#14B8A6]">Crear cuenta ciudadana</a>
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
export class LoginPageComponent {
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly session: AuthSessionService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  async submit() {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const user = await this.session.login(this.form.controls.email.value, this.form.controls.password.value);
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      const defaultTarget = user.roles.some((role) => ['ADMINISTRADOR', 'MODERADOR', 'ADMIN'].includes(role)) ? '/admin' : '/';
      const target = returnUrl || defaultTarget;
      await this.router.navigateByUrl(target);
    } catch (error) {
      if (this.session.isMissingProfileError(error)) {
        await this.router.navigateByUrl('/completar-perfil');
        return;
      }
      this.errorMessage.set(authErrorMessage(error, 'No se pudo iniciar sesión. Revisa tus credenciales.'));
    } finally {
      this.loading.set(false);
    }
  }
}
