export interface AuditoriaEvento {
  idEvento: string;
  idUsuario: string | null;
  aliasPublicoUsuario: string | null;
  emailUsuario: string | null;
  entidad: string;
  idEntidad: string;
  accion: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  ipOrigen: string;
  userAgent: string | null;
  creadoEn: string;
}
