export interface AdminReporteContenido {
  idReporteContenido: string;
  idUsuarioReporta: string;
  aliasUsuarioReporta: string;
  emailUsuarioReporta: string;
  idIncidencia: string | null;
  idComentario: string | null;
  idMultimedia: string | null;
  idConfirmacion: string | null;
  motivo: string;
  detalle: string | null;
  estadoRevision: string;
  creadoEn: string;
}
