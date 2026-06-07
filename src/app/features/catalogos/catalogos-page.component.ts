import { Component, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CategoriaIncidencia, EstadoIncidencia } from '../../core/models/catalogo.model';
import { CatalogosService } from '../../core/services/catalogos.service';

@Component({
  selector: 'app-catalogos-page',
  standalone: true,
  imports: [TableModule],
  template: `
    <div class="space-y-6">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-[var(--ca-teal)]">Catálogos</p>
        <h2 class="mt-1 text-2xl font-semibold">Categorías y estados</h2>
      </div>
      <section class="grid gap-6 xl:grid-cols-2">
        <article class="ca-card overflow-hidden">
          <p-table [value]="categorias()" responsiveLayout="stack">
            <ng-template pTemplate="caption">Categorías de incidencia</ng-template>
            <ng-template pTemplate="header">
              <tr><th>Código</th><th>Nombre</th><th>Requiere foto</th></tr>
            </ng-template>
            <ng-template pTemplate="body" let-categoria>
              <tr>
                <td class="font-mono text-sm">{{ categoria.codigo }}</td>
                <td>{{ categoria.nombre }}</td>
                <td>{{ categoria.requiereFoto ? 'Sí' : 'No' }}</td>
              </tr>
            </ng-template>
          </p-table>
        </article>
        <article class="ca-card overflow-hidden">
          <p-table [value]="estados()" responsiveLayout="stack">
            <ng-template pTemplate="caption">Estados de incidencia</ng-template>
            <ng-template pTemplate="header">
              <tr><th>Código</th><th>Nombre</th><th>Final</th></tr>
            </ng-template>
            <ng-template pTemplate="body" let-estado>
              <tr>
                <td class="font-mono text-sm">{{ estado.codigo }}</td>
                <td>{{ estado.nombre }}</td>
                <td>{{ estado.esEstadoFinal ? 'Sí' : 'No' }}</td>
              </tr>
            </ng-template>
          </p-table>
        </article>
      </section>
    </div>
  `,
})
export class CatalogosPageComponent implements OnInit {
  readonly categorias = signal<CategoriaIncidencia[]>([]);
  readonly estados = signal<EstadoIncidencia[]>([]);

  constructor(private readonly catalogosService: CatalogosService) {}

  ngOnInit() {
    this.catalogosService.categorias$.subscribe((items) => this.categorias.set(items));
    this.catalogosService.estados$.subscribe((items) => this.estados.set(items));
  }
}

