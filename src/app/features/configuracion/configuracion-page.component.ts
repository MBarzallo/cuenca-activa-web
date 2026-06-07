import { Component } from '@angular/core';

@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  template: `
    <section class="ca-card p-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-[var(--ca-teal)]">Sistema</p>
      <h2 class="mt-1 text-2xl font-semibold">Configuración</h2>
      <p class="mt-4 max-w-3xl leading-7 text-slate-600">Módulo reservado para configuración administrativa.</p>
    </section>
  `,
})
export class ConfiguracionPageComponent {}

