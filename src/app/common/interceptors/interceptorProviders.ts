import { LoggingInterceptor } from './logging-interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppHttpInterceptor } from './app-http-interceptor.service';

export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: AppHttpInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true },
];
