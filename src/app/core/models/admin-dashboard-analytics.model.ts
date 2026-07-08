export interface AdminDashboardAnalyticsResponse {
  summary: AdminSummaryMetrics;
  incidentsByDay: IncidentsByDay[];
  incidentsByStatus: IncidentsByStatus[];
  incidentsByCategory: IncidentsByCategory[];
  incidentsBySector: IncidentsBySector[];
  communityActivity: CommunityActivity[];
  moderation: ModerationSummary;
}

export interface AdminSummaryMetrics {
  totalIncidencias: number;
  pendientes: number;
  validadas: number;
  cerradas: number;
  enModeracion: number;
  usuariosActivos: number;
  tasaCierre: number;
  promedioDiario: number;
}

export interface IncidentsByDay {
  date: string;
  total: number;
}

export interface IncidentsByStatus {
  status: string;
  statusCode: string;
  total: number;
}

export interface IncidentsByCategory {
  category: string;
  categoryCode: string;
  total: number;
}

export interface IncidentsBySector {
  sectorId: string | null;
  sector: string;
  total: number;
}

export interface CommunityActivity {
  incidenciaId: string;
  titulo: string;
  categoria: string;
  estado: string;
  totalComentarios: number;
  totalVotos: number;
  totalValidaciones: number;
}

export interface ModerationSummary {
  pendientes: number;
  revisionManual: number;
  rechazadas: number;
  aprobadas: number;
}

export interface AdminDashboardAnalyticsFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string | null;
  categoriaId?: string | null;
  sectorId?: string | null;
  prioridad?: string | null;
}
