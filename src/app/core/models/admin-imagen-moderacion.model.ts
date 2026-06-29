export interface AdminImagenModeracion {
  idMultimedia: string;
  idIncidencia?: string;
  idConfirmacion?: string;
  idUsuarioSubida: string;
  tipoArchivo: string;
  bucket: string;
  storagePath: string;
  downloadUrl?: string;
  contentType?: string;
  sizeBytes?: number;
  nombreArchivo?: string;
  ordenVisualizacion: number;
  esPrincipal: boolean;
  subidoEn: string;
  estadoRevision: string;
  visiblePublicamente: boolean;
  resultadoModeracion?: string; // JSON string
  motivoRevision?: string;
  intentosRevision: number;
  fechaRevision?: string;
  revisadoManualmente: boolean;
  revisadoPor?: string;
  fechaRevisionManual?: string;
  aliasUsuarioSubida?: string;
  tituloIncidencia?: string;
  codigoCategoriaIncidencia?: string;
  nombreCategoriaIncidencia?: string;
}
