import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserProfileService } from '../../core/services/user-profile.service';
import { AdminUsuario } from '../../core/models/admin-usuario.model';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    ToggleButtonModule,
    TagModule,
    ToastModule,
    ButtonModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="space-y-6">
      <p-toast></p-toast>
      
      <!-- Compact Admin Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <span class="text-xs font-bold uppercase tracking-[0.15em] text-[var(--ca-teal)] block">Administración</span>
          <h2 class="text-2xl font-bold text-[var(--ca-navy)] mt-1">Gestión de Usuarios</h2>
          <p class="text-xs text-slate-500 mt-1 max-w-2xl">
            Busca ciudadanos registrados, actualiza sus roles y suspende o reactiva el acceso a la plataforma.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="fetchUsuarios()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer">
            <i class="pi pi-refresh"></i>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

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
            <button (click)="applyFilters()" class="flex-1 rounded-xl bg-[var(--ca-navy)] hover:bg-[var(--ca-navy)]/90 px-4 py-2 text-sm font-semibold text-white transition cursor-pointer">Filtrar</button>
            <button (click)="clearFilters()" class="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition cursor-pointer">Limpiar</button>
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
            <tr class="hover:bg-slate-50/45 cursor-pointer transition-colors" (click)="verDetalle(user)">
              <td>
                <div class="flex items-center gap-3">
                  <img *ngIf="user.fotoPerfilUrl" [src]="user.fotoPerfilUrl" class="w-9 h-9 rounded-full object-cover border border-slate-200" />
                  <div *ngIf="!user.fotoPerfilUrl" class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600 border border-slate-200">
                    {{ user.aliasPublico.substring(0, 2).toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-semibold text-sm text-slate-800">{{ user.nombres }} {{ user.apellidos }}</div>
                    <div class="text-xs text-slate-500">&#64;{{ user.aliasPublico }}</div>
                  </div>
                </div>
              </td>
              <td class="text-sm text-slate-700" (click)="$event.stopPropagation()">
                <div class="flex items-center justify-between gap-1.5">
                  <div class="min-w-0">
                    <div class="font-medium text-slate-800 truncate" [title]="user.email">{{ isRevealed(user.idUsuario) ? user.email : maskEmail(user.email) }}</div>
                    <div class="text-slate-500 text-xs mt-0.5">{{ isRevealed(user.idUsuario) ? (user.telefono || 'Sin teléfono') : maskPhone(user.telefono) }}</div>
                  </div>
                  <button 
                    pButton
                    type="button"
                    [text]="true"
                    [rounded]="true"
                    severity="secondary"
                    [icon]="isRevealed(user.idUsuario) ? 'pi pi-eye-slash' : 'pi pi-eye'"
                    class="h-7 w-7 text-slate-400 hover:text-[var(--ca-teal)] flex-shrink-0"
                    (click)="toggleReveal(user.idUsuario, $event)"
                    [title]="isRevealed(user.idUsuario) ? 'Ocultar contacto' : 'Mostrar contacto'"
                  ></button>
                </div>
              </td>
              <td (click)="$event.stopPropagation()">
                <div class="flex items-center gap-2">
                  <p-tag [value]="user.estadoCuenta" [severity]="user.estadoCuenta === 'ACTIVO' ? 'success' : 'danger'"></p-tag>
                  <p-toggleButton 
                    [ngModel]="user.estadoCuenta === 'ACTIVO'" 
                    (onChange)="toggleEstadoConfirmado(user, $event.checked)" 
                    onLabel="Bloquear" 
                    offLabel="Activar" 
                    onIcon="pi pi-lock" 
                    offIcon="pi pi-lock-open"
                    styleClass="p-button-sm p-button-text p-button-secondary py-1 text-xs"
                  ></p-toggleButton>
                </div>
              </td>
              <td (click)="$event.stopPropagation()">
                <p-multiSelect 
                  [options]="rolesOptions" 
                  [ngModel]="user.roles" 
                  (onChange)="updateRolesConfirmado(user, $event.value)" 
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

    <!-- DETAIL DRAWER -->
    <div *ngIf="showDetailDrawer() && selectedUser() as user">
      <!-- Backdrop -->
      <div class="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs transition-opacity" (click)="closeDetailDrawer()"></div>
      
      <!-- Drawer Container -->
      <div class="fixed inset-y-0 right-0 z-[1001] w-full max-w-xl bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300">
        <!-- Header -->
        <div class="bg-[var(--ca-navy)] text-white p-6 flex items-center justify-between shrink-0">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-[var(--ca-gold)]">Detalle del Usuario</span>
            <h3 class="text-xl font-bold mt-1">&#64;{{ user.aliasPublico }}</h3>
          </div>
          <button (click)="closeDetailDrawer()" class="text-white hover:text-slate-200 transition cursor-pointer p-1">
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Perfil resumido -->
          <div class="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <img *ngIf="user.fotoPerfilUrl" [src]="user.fotoPerfilUrl" class="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
            <div *ngIf="!user.fotoPerfilUrl" class="w-16 h-16 rounded-full bg-slate-200 text-slate-600 font-bold text-xl flex items-center justify-center border-2 border-white shadow-sm">
              {{ user.aliasPublico.substring(0, 2).toUpperCase() }}
            </div>
            <div>
              <h4 class="text-base font-bold text-slate-800">{{ user.nombres }} {{ user.apellidos }}</h4>
              <span class="text-xs text-slate-500 font-medium">&#64;{{ user.aliasPublico }}</span>
              <div class="flex items-center gap-2 mt-2">
                <p-tag [value]="user.estadoCuenta" [severity]="user.estadoCuenta === 'ACTIVO' ? 'success' : 'danger'"></p-tag>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" [ngClass]="getUserLevelClass(user.puntosTotales)">
                  {{ getUserLevel(user.puntosTotales) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Información general -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-450 uppercase tracking-wider">Información General</h4>
            <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 text-xs text-slate-700">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 block uppercase">Identificador</span>
                  <div class="flex items-center gap-1.5 mt-1">
                    <span class="font-mono text-xs text-slate-650 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {{ user.idUsuario }}
                    </span>
                    <button (click)="copiarID($event, user.idUsuario)" class="text-slate-400 hover:text-[var(--ca-teal)] transition cursor-pointer p-1 bg-slate-50 rounded border border-slate-200" title="Copiar ID">
                      <i class="pi pi-copy text-xs"></i>
                    </button>
                  </div>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 block uppercase">Puntos Totales</span>
                  <span class="font-bold text-sm text-[var(--ca-navy)] block mt-1">{{ user.puntosTotales }} pts</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 block uppercase">Correo Electrónico</span>
                  <div class="flex items-center gap-1.5 mt-1">
                    <span class="font-semibold truncate" [title]="user.email">
                      {{ isRevealed(user.idUsuario) ? user.email : maskEmail(user.email) }}
                    </span>
                    <button 
                      pButton
                      type="button"
                      [text]="true"
                      [rounded]="true"
                      severity="secondary"
                      [icon]="isRevealed(user.idUsuario) ? 'pi pi-eye-slash' : 'pi pi-eye'"
                      class="h-6 w-6 p-0 text-slate-400 hover:text-[var(--ca-teal)]"
                      (click)="toggleReveal(user.idUsuario, $event)"
                      [title]="isRevealed(user.idUsuario) ? 'Ocultar' : 'Revelar'"
                    ></button>
                  </div>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 block uppercase">Teléfono</span>
                  <span class="font-semibold block mt-1.5">
                    {{ isRevealed(user.idUsuario) ? (user.telefono || 'Sin registrar') : maskPhone(user.telefono) }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 block uppercase">Fecha de Registro</span>
                  <span class="font-semibold block mt-1">{{ user.fechaRegistro | date:'medium' }}</span>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 block uppercase">Roles del Sistema</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span *ngFor="let rol of user.roles" class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-200">
                      {{ rol }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones de Navegación -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-450 uppercase tracking-wider">Enlaces Rápidos</h4>
            <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-3">
              <a [routerLink]="['/admin/incidencias']" [queryParams]="{ usuario: user.aliasPublico }" (click)="closeDetailDrawer()" class="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
                <i class="pi pi-map-marker"></i>
                <span>Ver Reportes de Ciudadano</span>
              </a>
              <a [routerLink]="['/admin/auditoria']" [queryParams]="{ usuario: user.aliasPublico }" (click)="closeDetailDrawer()" class="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
                <i class="pi pi-shield"></i>
                <span>Ver Bitácora de Auditoría</span>
              </a>
            </div>
          </div>

          <!-- Modificaciones rápidas -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-450 uppercase tracking-wider">Moderar cuenta</h4>
            <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
              <!-- Activar / Bloquear -->
              <div class="flex items-center justify-between text-xs">
                <div>
                  <span class="font-bold text-slate-750 block">Estado de la cuenta</span>
                  <span class="text-slate-400 block mt-0.5">Suspender el acceso al sistema.</span>
                </div>
                <p-toggleButton 
                  [ngModel]="user.estadoCuenta === 'ACTIVO'" 
                  (onChange)="toggleEstadoConfirmado(user, $event.checked)" 
                  onLabel="Cuenta Activa" 
                  offLabel="Cuenta Suspendida" 
                  onIcon="pi pi-check-circle" 
                  offIcon="pi pi-ban"
                  styleClass="p-button-sm py-1.5"
                ></p-toggleButton>
              </div>

              <!-- Roles multiselect en drawer -->
              <div class="pt-3 border-t border-slate-100 space-y-2">
                <span class="font-bold text-slate-750 block text-xs">Asignar Roles Administrativos</span>
                <p-multiSelect 
                  [options]="rolesOptions" 
                  [ngModel]="user.roles" 
                  (onChange)="updateRolesConfirmado(user, $event.value)" 
                  optionLabel="label" 
                  optionValue="value" 
                  display="chip" 
                  placeholder="Seleccionar roles"
                  styleClass="w-full"
                ></p-multiSelect>
              </div>
            </div>
          </div>

        </div>
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

  // Drawer
  readonly showDetailDrawer = signal<boolean>(false);
  readonly selectedUser = signal<AdminUsuario | null>(null);

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
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService
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

  toggleEstadoConfirmado(usuario: AdminUsuario, actiVar: boolean) {
    const nuevoEstado = actiVar ? 'ACTIVO' : 'BLOQUEADO';
    const labelAccion = actiVar ? 'activar' : 'bloquear';
    
    this.confirmationService.confirm({
      header: 'Confirmar cambio de estado',
      message: `¿Está seguro de que desea ${labelAccion} al usuario @${usuario.aliasPublico}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, continuar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.userService.changeUserStatus(usuario.idUsuario, nuevoEstado).subscribe({
          next: () => {
            usuario.estadoCuenta = nuevoEstado;
            // Si el usuario seleccionado en el drawer es el mismo, actualizamos el drawer
            const current = this.selectedUser();
            if (current && current.idUsuario === usuario.idUsuario) {
              current.estadoCuenta = nuevoEstado;
              this.selectedUser.set({ ...current });
            }
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Usuario ${usuario.aliasPublico} actualizado a ${nuevoEstado}` });
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo actualizar el estado de cuenta' });
            // Recargar para restaurar
            this.fetchUsuarios();
          }
        });
      },
      reject: () => {
        // Recargar para restaurar estado en la UI
        this.fetchUsuarios();
      }
    });
  }

  updateRolesConfirmado(usuario: AdminUsuario, roles: string[]) {
    this.confirmationService.confirm({
      header: 'Confirmar cambio de roles',
      message: `¿Está seguro de que desea asignar los roles [${roles.join(', ')}] al usuario @${usuario.aliasPublico}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, guardar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.userService.changeUserRoles(usuario.idUsuario, roles).subscribe({
          next: () => {
            usuario.roles = roles;
            const current = this.selectedUser();
            if (current && current.idUsuario === usuario.idUsuario) {
              current.roles = roles;
              this.selectedUser.set({ ...current });
            }
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Roles de ${usuario.aliasPublico} actualizados` });
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudieron actualizar los roles' });
            // Recargar para restaurar
            this.fetchUsuarios();
          }
        });
      },
      reject: () => {
        // Recargar para restaurar roles en la UI
        this.fetchUsuarios();
      }
    });
  }

  // Helpers de enmascaramiento e información sensible
  readonly revealedUsers = signal<Set<string>>(new Set());

  isRevealed(userId: string): boolean {
    return this.revealedUsers().has(userId);
  }

  toggleReveal(userId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.revealedUsers.update(set => {
      const newSet = new Set(set);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }

  maskEmail(email: string | null | undefined): string {
    if (!email) return 'Sin correo';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) {
      return name[0] + '*@' + domain;
    }
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1] + '@' + domain;
  }

  maskPhone(phone: string | null | undefined): string {
    if (!phone) return 'Sin teléfono';
    const cleaned = phone.trim();
    if (cleaned.length <= 4) {
      return '*'.repeat(cleaned.length);
    }
    return cleaned.substring(0, 2) + '*'.repeat(cleaned.length - 4) + cleaned.substring(cleaned.length - 2);
  }

  // Helpers de visualización
  getUserLevel(puntos: number): string {
    if (puntos <= 100) return 'Vecino Novato';
    if (puntos <= 500) return 'Observador Urbano';
    return 'Guardián de Cuenca';
  }

  getUserLevelClass(puntos: number): string {
    if (puntos <= 100) return 'bg-slate-100 text-slate-700 border border-slate-200';
    if (puntos <= 500) return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }

  copiarID(event: Event, id: string) {
    event.stopPropagation();
    navigator.clipboard.writeText(id).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copiado',
        detail: 'ID de usuario copiado al portapapeles',
        life: 2000
      });
    });
  }

  verDetalle(usuario: AdminUsuario) {
    this.selectedUser.set(usuario);
    this.showDetailDrawer.set(true);
  }

  closeDetailDrawer() {
    this.showDetailDrawer.set(false);
    this.selectedUser.set(null);
  }
}
