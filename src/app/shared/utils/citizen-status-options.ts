import { EstadoIncidencia } from '../../core/models/catalogo.model';
import { Incidencia } from '../../core/models/incidencia.model';

const CITIZEN_STATUS_BLOCKLIST = [
  'RECH',
  'CANCEL',
  'ELIM',
  'OCULT',
  'MODER',
  'DUPLIC',
  'SPAM',
  'BLOQ',
  'SUSP',
];

export function isFinalCitizenIncident(incidencia: Incidencia): boolean {
  const value = incidencia.codigoEstado.toUpperCase();
  return (
    !!incidencia.cerradoEn ||
    value.includes('CERR') ||
    value.includes('RESUEL') ||
    value.includes('COMPLET') ||
    value.includes('RECH') ||
    value.includes('CANCEL')
  );
}

export function citizenStatusOptions(estados: EstadoIncidencia[], incidencia: Incidencia): EstadoIncidencia[] {
  if (isFinalCitizenIncident(incidencia)) {
    return [];
  }

  return estados
    .filter((estado) => estado.codigo !== incidencia.codigoEstado)
    .filter((estado) => !CITIZEN_STATUS_BLOCKLIST.some((blocked) => estado.codigo.toUpperCase().includes(blocked)))
    .sort((a, b) => a.ordenFlujo - b.ordenFlujo);
}
