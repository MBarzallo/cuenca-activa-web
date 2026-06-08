import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  debug(message: string, ...optionalParams: any[]): void {
    if (!environment.production) {
      console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }
  }

  info(message: string, ...optionalParams: any[]): void {
    if (!environment.production) {
      console.info(`[INFO] ${message}`, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: any[]): void {
    if (!environment.production) {
      console.warn(`[WARN] ${message}`, ...optionalParams);
    }
  }

  error(message: string, ...optionalParams: any[]): void {
    if (!environment.production) {
      console.error(`[ERROR] ${message}`, ...optionalParams);
    }
  }
}
