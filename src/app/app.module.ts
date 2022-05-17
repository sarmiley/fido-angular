import { MessageService } from './common/message/message.service';
import { HomeModule } from './module/home/home.module';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { httpInterceptorProviders } from './common/interceptors/interceptorProviders';
import { ErrorLogHandler } from './common/errorHandler/error-log-handler';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule,
    AppRoutingModule,
    HomeModule,
    HttpClientModule,
  ],
  providers: [
    httpInterceptorProviders,
    MessageService,
    { provide: ErrorHandler, useClass: ErrorLogHandler },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
