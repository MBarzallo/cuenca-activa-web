import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserProfileService } from '../../core/services/user-profile.service';
import { AdminUsuario } from '../../core/models/admin-usuario.model';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    ToggleButtonModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <div class="space-y-6">
      <p-toast></p-toast>
      <section class="rounded-[28px] bg-[var(--ca-navy)] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ca-gold)]">Administración</p>
        <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">Gestión de Usuarios</h2>
        <p class="mt-3 max-w-3xl leading-7 text-slate-300">
          Busca ciudadanos registrados, actualiza sus roles y suspende o reactiva el acceso a la plataforma.
        </p>
      </section>

      <div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <!-- Filtros de búsqueda -->
        <div class="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-end">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-slate-500 uppercase">Alias Público</label>
            <input pInputText type="text" [(ngModel)]="filterAlias" placeholder="Buscar por alias..." class="w-full" (keyup.enter)="applyFilters()" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-slate-500 uppercase">Correo Electrónico</label>
            <input pInputText type="text" [(ngModel)]="filterEmail" placeholder="Buscar por correo..." class="w-full" (keyup.enter)="applyFilters()" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-slate-500 uppercase">Estado Cuenta</label>
            <p-select [options]="estadosOptions" [(ngModel)]="filterEstado" optionLabel="label" optionValue="value" placeholder="Cualquiera" styleClass="w-full" (onChange)="applyFilters()"></p-select>
          </div>
          <div class="flex gap-2">
            <button (click)="applyFilters()" class="flex-1 rounded-xl bg-[var(--ca-navy)] hover:bg-[var(--ca-navy)]/90 px-4 py-2 text-sm font-semibold text-white transition">Filtrar</button>
            <button (click)="clearFilters()" class="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition">Limpiar</button>
          </div>
        </div>

        <!-- Tabla de Usuarios -->
        <p-table 
          [value]="usuarios()" 
          [lazy]="true" 
          (onLazyLoad)="loadUsuarios($event)" 
          [paginator]="true" 
          [rows]="rows" 
          [totalRecords]="totalRecords()" 
          [loading]="loading()" 
          responsiveLayout="stack" 
          styleClass="p-datatable-sm ca-clean-table"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Usuario</th>
              <th>Contacto</th>
              <th>Estado de Cuenta</th>
              <th>Roles Asignados</th>
              <th>Puntos</th>
              <th>Fecha Registro</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-user>
            <tr>
              <td>
                <div class="flex items-center gap-3">
                  <img *ngIf="user.fotoPerfilUrl" [src]="user.fotoPerfilUrl" class="w-9 h-9 rounded-full object-cover border border-slate-200" />
                  <div *ngIf="!user.fotoPerfilUrl" class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600 border border-slate-200">
                    {{ user.aliasPublico.substring(0, 2).toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-semibold">{{ user.nombres }} {{ user.apellidos }}</div>
                    <div class="text-xs text-slate-500">&#64;{{ user.aliasPublico }}</div>
                  </div>
                </div>
              </td>
              <td class="text-sm">
                <div>{{ user.email }}</div>
                <div class="text-slate-500 text-xs">{{ user.telefono || 'Sin teléfono' }}</div>
              </td>
              <td>
                <div class="flex items-center gap-3">
                  <p-tag [value]="user.estadoCuenta" [severity]="user.estadoCuenta === 'ACTIVO' ? 'success' : 'danger'"></p-tag>
                  <p-toggleButton 
                    [ngModel]="user.estadoCuenta === 'ACTIVO'" 
                    (onChange)="toggleEstado(user, $event.checked)" 
                    onLabel="Bloquear" 
                    offLabel="Activar" 
                    onIcon="pi pi-lock" 
                    offIcon="pi pi-lock-open"
                    styleClass="p-button-sm p-button-text p-button-secondary py-1"
                  ></p-toggleButton>
                </div>
              </td>
              <td>
                <p-multiSelect 
                  [options]="rolesOptions" 
                  [ngModel]="user.roles" 
                  (onChange)="updateRoles(user, $event.value)" 
                  optionLabel="label" 
                  optionValue="value" 
                  display="chip" 
                  placeholder="Seleccionar roles"
                  styleClass="w-full max-w-[240px]"
                ></p-multiSelect>
              </td>
              <td class="font-bold text-[var(--ca-navy)] text-sm">
                {{ user.puntosTotales | number }} pts
              </td>
              <td class="text-sm text-slate-600">
                {{ user.fechaRegistro | date:'shortDate' }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class UsuariosPageComponent implements OnInit {
  readonly usuarios = signal<AdminUsuario[]>([]);
  readonly totalRecords = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly rows = 20;
  private currentOffset = 0;

  filterAlias = '';
  filterEmail = '';
  filterEstado: string | null = null;

  estadosOptions = [
    { label: 'Cualquiera', value: null },
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Bloqueado', value: 'BLOQUEADO' },
  ];

  rolesOptions = [
    { label: 'Ciudadano', value: 'CIUDADANO' },
    { label: 'Moderador', value: 'MODERADOR' },
    { label: 'Administrador', value: 'ADMINISTRADOR' },
    { label: 'Empleado', value: 'EMPLEADO' },
  ];

  constructor(
    private readonly userService: UserProfileService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit() {
    this.fetchUsuarios();
  }

  loadUsuarios(event: TableLazyLoadEvent) {
    this.currentOffset = event.first ?? 0;
    this.fetchUsuarios();
  }

  applyFilters() {
    this.currentOffset = 0;
    this.fetchUsuarios();
  }

  clearFilters() {
    this.filterAlias = '';
    this.filterEmail = '';
    this.filterEstado = null;
    this.currentOffset = 0;
    this.fetchUsuarios();
  }

  fetchUsuarios() {
    this.loading.set(true);
    this.userService.listUsersAdmin({
      aliasPublico: this.filterAlias,
      email: this.filterEmail,
      estadoCuenta: this.filterEstado ?? undefined,
      limit: this.rows,
      offset: this.currentOffset,
    }).subscribe({
      next: (response) => {
        this.usuarios.set(response.data);
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios' });
        this.loading.set(false);
      }
    });
  }

  toggleEstado(usuario: AdminUsuario, actiVar: boolean) {
    const nuevoEstado = actiVar ? 'ACTIVO' : 'BLOQUEADO';
    this.userService.changeUserStatus(usuario.idUsuario, nuevoEstado).subscribe({
      next: () => {
        usuario.estadoCuenta = nuevoEstado;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Usuario ${usuario.aliasPublico} actualizado a ${nuevoEstado}` });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo actualizar el estado de cuenta' });
      }
    });
  }

  updateRoles(usuario: AdminUsuario, roles: string[]) {
    this.userService.changeUserRoles(usuario.idUsuario, roles).subscribe({
      next: () => {
        usuario.roles = roles;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Roles de ${usuario.aliasPublico} actualizados` });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudieron actualizar los roles' });
        // Recargar para restaurar los valores en UI
        this.fetchUsuarios();
      }
    });
  }
}
