import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { retry } from 'rxjs/internal/operators/retry';
import { environment as env } from 'src/environments/environment';

export abstract class BaseService {
  constructor(private http: HttpClient) {}

  get(path: string): any {
    return this.http.get(`${env.apiUrl}${path}`).pipe(retry(1));
  }

  post(path: string, param: any = {}): any {
    return this.http.post(`${env.apiUrl}${path}`, param).pipe(retry(1));
  }
}
