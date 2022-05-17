import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from './../message/message.service';
import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class ErrorLogHandler implements ErrorHandler {
  constructor(private message: MessageService) { }

  handleError(error: any): void {
    if (error instanceof HttpErrorResponse) {
      console.log(error);
      this.message.add(`${error.message}`);
    } else {
      console.log(error);
      this.message.add(error);
    }
  }
}
