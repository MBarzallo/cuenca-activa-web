import { Component } from '@angular/core';

@Component({
  selector: 'app-reportes-contenido-page',
  standalone: true,
  template: `
    <section class="ca-card p-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-[var(--ca-teal)]">Moderación</p>
      <h2 class="mt-1 text-2xl font-semibold">Reportes de contenido</h2>
      <p class="mt-4 max-w-3xl leading-7 text-slate-600">
        Este módulo queda preparado para revisar denuncias ciudadanas, priorizar casos y registrar decisiones de moderación
        cuando la consulta administrativa esté disponible.
      </p>
    </section>
  `,
})
export class ReportesContenidoPageComponent {}
