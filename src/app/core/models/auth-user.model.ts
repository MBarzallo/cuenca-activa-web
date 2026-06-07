export type AppRole = 'CIUDADANO' | 'MODERADOR' | 'ADMINISTRADOR' | 'ADMIN' | string;

export interface AuthUser {
  idUsuario: string;
  email: string;
  nombres: string | null;
  apellidos: string | null;
  aliasPublico: string | null;
  telefono: string | null;
  fotoPerfilUrl: string | null;
  estadoCuenta: string;
  puntosTotales: number;
  idNivelActual: string | null;
  codigoNivelActual: string | null;
  nombreNivelActual: string | null;
  puntosMinimosNivel: number | null;
  puntosMaximosNivel: number | null;
  iconoNivelActual: string | null;
  roles: AppRole[];
  perfilCompleto: boolean;
}

export const ADMIN_ROLES = ['ADMINISTRADOR', 'MODERADOR', 'ADMIN'];

