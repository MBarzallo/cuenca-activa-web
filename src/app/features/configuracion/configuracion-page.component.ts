import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
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
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="space-y-6">
      <p-toast></p-toast>
      
      <!-- Compact Admin Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <span class="text-xs font-bold uppercase tracking-[0.15em] text-[var(--ca-teal)] block">Ajustes Globales</span>
          <h2 class="text-2xl font-bold text-[var(--ca-navy)] mt-1">Configuración del Sistema</h2>
          <p class="text-xs text-slate-500 mt-1 max-w-2xl">
            Modifica los límites, umbrales y parámetros generales que controlan el comportamiento de la aplicación en tiempo real.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="fetchParametros()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer">
            <i class="pi pi-refresh"></i>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <!-- Grid de Parámetros -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <p-card *ngFor="let param of parametros()" styleClass="border-0 shadow-sm rounded-2xl overflow-hidden">
          <ng-template pTemplate="header">
            <div class="border-b border-slate-100 px-5 py-4 bg-slate-50 flex items-center justify-between">
              <span class="font-mono font-bold text-xs text-[var(--ca-navy)] uppercase tracking-wide">{{ param.codigo }}</span>
              <span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold uppercase">{{ param.tipoDato }}</span>
            </div>
          </ng-template>
          
          <div class="p-4 space-y-4">
            <p class="text-sm text-slate-650 leading-relaxed">{{ param.descripcion || 'Sin descripción disponible.' }}</p>
            
            <div class="flex items-center gap-4 mt-2">
              <div class="flex-1">
                <!-- Edición booleana -->
                <p-toggleButton 
                  *ngIf="param.tipoDato === 'BOOLEAN' || param.tipoDato === 'BOOLEANO'" 
                  [(ngModel)]="param.booleanVal"
                  onLabel="Habilitado" 
                  offLabel="Deshabilitado" 
                  onIcon="pi pi-check" 
                  offIcon="pi pi-times"
                  styleClass="w-full sm:w-auto"
                ></p-toggleButton>

                <!-- Edición numérica o texto -->
                <input 
                  *ngIf="param.tipoDato !== 'BOOLEAN' && param.tipoDato !== 'BOOLEANO'" 
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
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService
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
          booleanVal: p.tipoDato === 'BOOLEAN' || p.tipoDato === 'BOOLEANO' ? p.valor === 'true' : undefined
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
    if (param.tipoDato === 'BOOLEAN' || param.tipoDato === 'BOOLEANO') {
      valorFinal = param.booleanVal ? 'true' : 'false';
    }

    if (!valorFinal || valorFinal.trim() === '') {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'El valor del parámetro no puede estar vacío.' });
      return;
    }

    const valorAConfirmar = valorFinal.trim();

    this.confirmationService.confirm({
      header: 'Confirmar Modificación',
      message: `¿Está seguro de cambiar el valor del parámetro "${param.codigo}" a "${valorAConfirmar}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Guardar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.parametrosService.update(param.codigo, valorAConfirmar).subscribe({
          next: () => {
            param.valor = valorAConfirmar;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Parámetro ${param.codigo} guardado correctamente` });
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo guardar el parámetro' });
          }
        });
      }
    });
  }
}
