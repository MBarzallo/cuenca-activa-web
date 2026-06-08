import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoggerService } from '../services/logger.service';
import { MessageService } from 'primeng/api';

function generateRequestId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const messageService = inject(MessageService);
  
  const requestId = generateRequestId();
  
  const modifiedReq = req.clone({
    setHeaders: {
      'X-Request-Id': requestId
    }
  });

  const startTime = Date.now();
  logger.info(`HttpRequest id=${requestId} method=${modifiedReq.method} url=${modifiedReq.urlWithParams}`);

  return next(modifiedReq).pipe(
    tap(event => {
      if (event.type === 4) { // HttpResponse
        const duration = Date.now() - startTime;
        logger.info(`HttpResponse id=${requestId} method=${modifiedReq.method} url=${modifiedReq.urlWithParams} status=${event.status} durationMs=${duration}`);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const duration = Date.now() - startTime;
      logger.error(`HttpError id=${requestId} method=${modifiedReq.method} url=${modifiedReq.urlWithParams} status=${error.status} durationMs=${duration} message=${error.message}`);
      
      let userMessage = 'Ocurrió un error inesperado al procesar la solicitud.';
      if (error.error && error.error.message) {
        userMessage = error.error.message;
      } else if (error.status === 401) {
        userMessage = 'Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.';
      } else if (error.status === 403) {
        userMessage = 'No tienes permisos para realizar esta acción.';
      } else if (error.status === 404) {
        userMessage = 'El recurso solicitado no fue encontrado.';
      } else if (error.status === 0) {
        userMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      }

      messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: userMessage,
        life: 5000
      });

      return throwError(() => error);
    })
  );
};
