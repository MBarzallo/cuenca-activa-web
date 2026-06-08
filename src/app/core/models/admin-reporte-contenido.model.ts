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
  // Resolved details from JOINs
  contenidoComentario?: string | null;
  aliasAutorComentario?: string | null;
  urlMultimedia?: string | null;
  aliasAutorMultimedia?: string | null;
  observacionConfirmacion?: string | null;
  aliasAutorConfirmacion?: string | null;
  idIncidenciaRelacionada?: string | null;
  tituloIncidencia?: string | null;
}
