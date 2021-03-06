import { FidoStatusMsg } from './../../model/utils/fido-status-msg';
import { Observable } from 'rxjs';
import { Component, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, NgForm } from '@angular/forms';
import { AttestationConveyancePreferenceEnum } from './../../common/enum/attestation-conveyance-preference-enum';
import { AuthenticatorAttachmentEnum } from './../../common/enum/authenticator-attachment-enum';
import { ResidentKeyRequirement } from './../../common/enum/resident-key-requirement-enum';
import { credentialProtectionPolicy } from './../../common/enum/credential-protection-policy-enum';
import { ServerPublicKeyCredentialCreationOptionsRequest } from 'src/app/model/request/server-public-key-credential-creation-options-request';
import { FidoService } from './fido.service';
import {
  removeEmpty,
  base64UrlDecode,
  base64UrlEncode,
  // logObject,
  logVariable
} from './../utils/helper'

@Component({
  selector: 'app-fido',
  templateUrl: './fido.component.html',
  styleUrls: ['./fido.component.scss']
})
export class FidoComponent implements OnInit {

  @ViewChild('fidoForm')
  fidoForm!: NgForm;

  @ViewChild('usernameFormctrl')
  usernameFormctrl!: FormControl;

  username = ''
  displayName = '';
  isSubmited = false;

  // attestation Conveyance Preference
  // 驗證器自我證明簽章驗證偏好，若有指定則傳送指定偏好，不指定則空
  specifyAttestationConvenyance: boolean = true;
  attestationConveyancePreference: string = AttestationConveyancePreferenceEnum.NONE; // default to none

  // --- Authenticator Selection ---
  // Authenticator Attachment
  // 指定驗證器附件模式，分為客戶端設備平台驗證或跨平台驗證器驗證
  isSupportAttachmentPlatform = true;
  specifyAuthenticatorSelection: boolean = true;
  specifyAuthenticatorAttachment: boolean = true;
  attachmentPlatform: string = AuthenticatorAttachmentEnum.PLATFORM;

  // 是否利用client-side discoverable credential，使discoverable credential capable authenticator建立 assertion signature，以達到username-less flow
  requireResidentKey: boolean = false; // default to false

  // 用戶驗證，驗證是否為合規的驗證器  (疑問：須註冊metadata service？)
  userVerificationRequired: string = ResidentKeyRequirement.PREFERRED;

  // TODO 參考CTAP 12.1，有關驗證器擴展驗證相關
  enableCredProtect: boolean = true;
  enforceCredentialProtectionPolicy: boolean = true;
  credentialProtectionPolicy: string = credentialProtectionPolicy.USER_VERIFICATION_OPTIONAL

  abortController = new AbortController();
  abortSignal = this.abortController.signal;

  resTextMsgs: Array<FidoStatusMsg> = [];
  isSuccess = false;


  constructor(private fidoService: FidoService) { }

  ngOnInit(): void {
  }


  resetForm(): void {
    this.isSubmited = false;
    this.fidoForm.resetForm();
  }

  /**
   * 註冊按鈕事件
   */
  registerButtonClicked(): void {
    this.isSubmited = true;
    if (this.fidoForm.valid) {
      // req param
      let serverPublicKeyCredentialCreationOptionsRequest: ServerPublicKeyCredentialCreationOptionsRequest = {
        username: this.username,
        displayName: this.displayName,
        attestation: this.specifyAttestationConvenyance ? this.attestationConveyancePreference : null,
        authenticatorSelection: {},
        credProtect: {},
      };

      if (this.enableCredProtect) {
        let credProtect = {
          credentialProtectionPolicy: this.credentialProtectionPolicy,
          enforceCredentialProtectionPolicy:
            this.enforceCredentialProtectionPolicy ?? false
        };
        serverPublicKeyCredentialCreationOptionsRequest.credProtect = credProtect;
      }

      if (this.specifyAuthenticatorSelection) {
        let authenticatorSelection = {
          requireResidentKey: this.requireResidentKey,
          userVerification: this.userVerificationRequired,
          authenticatorAttachment: this.specifyAuthenticatorAttachment
            ? this.attachmentPlatform
            : null,
        };
        serverPublicKeyCredentialCreationOptionsRequest.authenticatorSelection =
          authenticatorSelection;
      }

      // 呼叫attestation/options
      const createCredentialOptions: Observable<any> = this.fidoService.attestationOptions(serverPublicKeyCredentialCreationOptionsRequest)
      createCredentialOptions.subscribe(response => {
        if (response.status !== 'ok') {
          if (response.errorMessage) {
            this.pushStatusMsg(response.errorMessage, false);
          } else {
            this.pushStatusMsg('Register ****FAIL****, res: ${JSON.stringify(response)} ', false);
          }
        } else {
          this.pushStatusMsg(`Call attestation options Success, res: ${JSON.stringify(response)}`, true)

          const options = this.performMakeCredReq(response)
          // 利用navigator creadentials.create api產生PublicKeyCredential
          this.createCredential(options)
            .then((rawAttestation: any) => {

              // 擷取api產生PublicKeyCredential資訊，作為request呼叫attestation/result api
              let attestation = {
                rawId: base64UrlEncode(rawAttestation?.rawId),
                id: base64UrlEncode(rawAttestation?.rawId),
                response: {
                  clientDataJSON: base64UrlEncode(
                    rawAttestation.response.clientDataJSON
                  ),
                  attestationObject: base64UrlEncode(
                    rawAttestation.response.attestationObject
                  ),
                  transports: (typeof rawAttestation.response.getTransports === 'function') ? rawAttestation.response.getTransports() : null
                },
                type: rawAttestation.type,
                extensions: rawAttestation.getClientExtensionResult ? rawAttestation.getClientExtensionResults() : {},
              };

              // 呼叫attestation/result
              return this.fidoService.attestationResult(attestation).subscribe(res => {
                if (res.status !== 'ok') {
                  this.pushStatusMsg(res.errorMessage, false);
                } else {
                  this.pushStatusMsg(`Call attestation result Success, res: ${JSON.stringify(response)}`, true)
                  this.pushStatusMsg('Register SUCCESS !!!', true);
                }
              });
            })
            .catch((error: any) => {
              this.pushStatusMsg('createCredential **FAIL** please see console log', false);
              this.isSuccess = false;
              console.error('create credential error: ' + error);
              if (error == 'AbortError') {
                console.info('Aborted by user');
              }
              return Promise.reject(error);
            })
        }
      })
    }
  }


  /**
   * 驗證按鈕事件
   */
  authenticateButtonClicked() {
    // prepare parameter
    let serverPublicKeyCredentialGetOptionsRequest = {
      username: this.username,
      userVerification: this.userVerificationRequired
    };

    this.fidoService.assertionOptions(serverPublicKeyCredentialGetOptionsRequest)
      .subscribe((response: any) => {
        if (response.status !== 'ok') {
          this.pushStatusMsg(response.errorMessage, false);
        } else {
          this.pushStatusMsg(`Call assertion Options Success, res: ${JSON.stringify(response)}`, true)
          let getCredentialOptions = this.performGetCredReq(response);

          // call navigator.credentials.get 取得 PublicKeyCredential
          this.getAssertion(getCredentialOptions)
            .then((rawAssertion: any) => {
              let assertion = {
                rawId: base64UrlEncode(rawAssertion?.rawId),
                id: base64UrlEncode(rawAssertion?.rawId),
                response: {
                  clientDataJSON: base64UrlEncode(rawAssertion?.response?.clientDataJSON),
                  userHandle: base64UrlEncode(rawAssertion?.response?.userHandle),
                  signature: base64UrlEncode(rawAssertion?.response.signature),
                  authenticatorData: base64UrlEncode(rawAssertion?.response.authenticatorData)
                },
                type: rawAssertion?.type,
                extensions: rawAssertion.getClientExtensionResults ? rawAssertion.getClientExtensionResults() : {}
              };

              return this.fidoService.assertionResult(assertion).subscribe((response) => {
                if (response.status !== 'ok') {
                  this.pushStatusMsg(response.errorMessage, false);
                } else {
                  this.pushStatusMsg(`Call assertion Result Success, res: ${JSON.stringify(response)}`, true)
                  this.pushStatusMsg('Authenticate SUCCESS !!!', true);

                }
              });
            }).catch((err) => {
              this.pushStatusMsg('getAssertion **FAIL** please see console log', false);
              if (err == "AbortError") {
                console.info("Aborted by user");
              }
              return Promise.reject(err);
            })
        }
      });
  }

  // call navigator.credentials.get 取得 publicKeyCredential
  getAssertion(options: any) {
    if (!PublicKeyCredential) {
      return Promise.reject("WebAuthn APIs are not available on this user agent.");
    }

    return navigator.credentials.get({ publicKey: options, signal: this.abortSignal })
  }



  // 利用navigator creadentials.create api，並帶入public key option 資訊以及 abortSignal(取消請求)
  // 參數型別為CredentialCreationOptions
  createCredential(options: any): any {
    if (
      !PublicKeyCredential ||
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !==
      'function'
    ) {
      return Promise.reject(
        'WebAuthn APIs are not available on this user agent.'
      );
    }
    return navigator.credentials.create({ publicKey: options, signal: this.abortSignal })
  }

  // 從options res 取出challenge & 其他cred資訊
  performMakeCredReq = (makeCredReq: any) => {

    makeCredReq.challenge = base64UrlDecode(makeCredReq.challenge);
    makeCredReq.user.id = base64UrlDecode(makeCredReq.user.id);

    //Base64url decoding of id in excludeCredentials
    if (makeCredReq.excludeCredentials instanceof Array) {
      for (let i of makeCredReq.excludeCredentials) {
        if ('id' in i) {
          i.id = base64UrlDecode(i.id);
        }
      }
    }

    delete makeCredReq.status;
    delete makeCredReq.errorMessage;

    removeEmpty(makeCredReq);

    // logObject('Updating credentials ', makeCredReq);
    return makeCredReq;
  };

  // 取出資訊
  performGetCredReq = (getCredReq: any) => {
    getCredReq.challenge = base64UrlDecode(getCredReq.challenge);

    //Base64url decoding of id in allowCredentials
    if (getCredReq.allowCredentials instanceof Array) {
      for (let i of getCredReq.allowCredentials) {
        if ('id' in i) {
          i.id = base64UrlDecode(i.id);
        }
      }
    }

    delete getCredReq.status;
    delete getCredReq.errorMessage;

    removeEmpty(getCredReq);

    return getCredReq;
  };

  pushStatusMsg(statusMsg: string = '', isSuccess: boolean = true) {
    this.resTextMsgs.push({ statusMsg, isSuccess });
  }

  getReverseStatusMsg(): Array<FidoStatusMsg> {
    const newMsgAry = this.resTextMsgs;
    return newMsgAry.reverse()
  }

  clearAllStatusMsg(): void {
    this.resTextMsgs.length = 0;
  }
}
