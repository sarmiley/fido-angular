import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './../../common/base/base.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FidoService extends BaseService {

  constructor(http: HttpClient) {
    super(http);
  }

  attestationOptions(serverPublicKeyCredentialCreationOptionsRequest: any): Observable<any> {
    return this.post(
      'attestation/options',
      serverPublicKeyCredentialCreationOptionsRequest
    );
  }

  attestationResult(attestation: any): Observable<any> {
    return this.post('attestation/result', attestation);
  }

  assertionOptions(serverPublicKeyCredentialGetOptionsRequest: any): Observable<any> {
    return this.post('assertion/options', serverPublicKeyCredentialGetOptionsRequest);
  }

  assertionResult(assertion: any): Observable<any> {
    return this.post('assertion/result', assertion);
  }


}
