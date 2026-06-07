import { Component } from '@angular/core';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  template: `
    <section class="ca-card p-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-[var(--ca-teal)]">Administración</p>
      <h2 class="mt-1 text-2xl font-semibold">Usuarios</h2>
      <p class="mt-4 max-w-3xl leading-7 text-slate-600">
        La web obtiene el usuario actual desde <span class="font-mono">/api/auth/me</span>. Falta un endpoint
        administrativo para revisar usuarios, roles y estados de cuenta.
      </p>
    </section>
  `,
})
export class UsuariosPageComponent {}

