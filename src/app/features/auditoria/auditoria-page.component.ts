import { Component } from '@angular/core';

@Component({
  selector: 'app-auditoria-page',
  standalone: true,
  template: `
    <section class="ca-card p-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-[var(--ca-teal)]">Trazabilidad</p>
      <h2 class="mt-1 text-2xl font-semibold">Auditoría</h2>
      <p class="mt-4 max-w-3xl leading-7 text-slate-600">
        La trazabilidad se registra automáticamente cuando ocurren acciones importantes. Esta vista queda preparada
        para consultar eventos con filtros de usuario, entidad, acción, resultado y fecha.
      </p>
    </section>
  `,
})
export class AuditoriaPageComponent {}
