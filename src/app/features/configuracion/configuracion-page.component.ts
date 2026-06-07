import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ParametrosSistemaService } from '../../core/services/parametros-sistema.service';
import { ParametroSistema } from '../../core/models/parametro-sistema.model';

@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    ToggleButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <div class="space-y-6">
      <p-toast></p-toast>
      <section class="rounded-[28px] bg-[var(--ca-navy)] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ca-gold)]">Ajustes Globales</p>
        <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">Configuración del Sistema</h2>
        <p class="mt-3 max-w-3xl leading-7 text-slate-300">
          Modifica los límites, umbrales y parámetros generales que controlan el comportamiento de la aplicación en tiempo real.
        </p>
      </section>

      <div class="grid gap-6 md:grid-cols-2">
        <p-card *ngFor="let param of parametros()" styleClass="border-0 shadow-sm rounded-2xl overflow-hidden">
          <ng-template pTemplate="header">
            <div class="border-b border-slate-100 px-5 py-4 bg-slate-50 flex items-center justify-between">
              <span class="font-mono font-bold text-xs text-[var(--ca-navy)] uppercase tracking-wide">{{ param.codigo }}</span>
              <span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold uppercase">{{ param.tipoDato }}</span>
            </div>
          </ng-template>
          
          <div class="p-4 space-y-4">
            <p class="text-sm text-slate-600 leading-6">{{ param.descripcion || 'Sin descripción disponible.' }}</p>
            
            <div class="flex items-center gap-4 mt-2">
              <div class="flex-1">
                <!-- Edición booleana -->
                <p-toggleButton 
                  *ngIf="param.tipoDato === 'BOOLEANO'" 
                  [(ngModel)]="param.booleanVal"
                  onLabel="Habilitado" 
                  offLabel="Deshabilitado" 
                  onIcon="pi pi-check" 
                  offIcon="pi pi-times"
                  styleClass="w-full sm:w-auto"
                ></p-toggleButton>

                <!-- Edición numérica o texto -->
                <input 
                  *ngIf="param.tipoDato !== 'BOOLEANO'" 
                  pInputText 
                  type="text" 
                  [(ngModel)]="param.valor" 
                  class="w-full font-mono text-sm" 
                  placeholder="Ingrese el valor..."
                />
              </div>

              <button 
                pButton 
                icon="pi pi-save" 
                label="Guardar" 
                class="p-button-primary shrink-0"
                (click)="guardarParametro(param)"
              ></button>
            </div>
          </div>
        </p-card>
      </div>
    </div>
  `,
})
export class ConfiguracionPageComponent implements OnInit {
  readonly parametros = signal<Array<ParametroSistema & { booleanVal?: boolean }>>([]);
  readonly loading = signal<boolean>(false);

  constructor(
    private readonly parametrosService: ParametrosSistemaService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit() {
    this.fetchParametros();
  }

  fetchParametros() {
    this.loading.set(true);
    this.parametrosService.list().subscribe({
      next: (data) => {
        const mapped = data.map(p => ({
          ...p,
          booleanVal: p.tipoDato === 'BOOLEANO' ? p.valor === 'true' : undefined
        }));
        this.parametros.set(mapped);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los parámetros del sistema' });
        this.loading.set(false);
      }
    });
  }

  guardarParametro(param: ParametroSistema & { booleanVal?: boolean }) {
    let valorFinal = param.valor;
    if (param.tipoDato === 'BOOLEANO') {
      valorFinal = param.booleanVal ? 'true' : 'false';
    }

    if (!valorFinal || valorFinal.trim() === '') {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'El valor del parámetro no puede estar vacío.' });
      return;
    }

    this.parametrosService.update(param.codigo, valorFinal.trim()).subscribe({
      next: () => {
        param.valor = valorFinal;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Parámetro ${param.codigo} guardado correctamente` });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo guardar el parámetro' });
      }
    });
  }
}
