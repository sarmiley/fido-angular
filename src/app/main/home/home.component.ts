import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  isRegBtnShow = false;
  isAuthenticateBtnShow = false;
  isStatusMsgShow = false;
  isSupportAttachmentPlatform = true;

  ishiddenRegSpinner = true;

  abortController = new AbortController();
  abortSignal = this.abortController.signal;

  username = '';
  displayName = '';

  statusText = '';

  specifyAuthenticatorSelection: boolean = true;
  specifyAuthenticatorAttachment: boolean = true;
  attachment: string = '';
  requireResidentKey: boolean = true;

  constructor() {}

  ngOnInit(): void {
    this.checkPublicKeyCredIsAvailable();
  }

  registerButtonClicked(): void {
    if (this.username === '') {
      this.statusText = 'Input user name first';
      this.isStatusMsgShow = true;
      return;
    }
    if (this.displayName === '') {
      this.statusText = 'Input display name first';
      this.isStatusMsgShow = true;
      return;
    }

    this.disableControls();
    this.ishiddenRegSpinner = true;
  }

  // 確認設備是否可以取到publick key
  checkPublicKeyCredIsAvailable(): void {
    //Update UI to reflect availability of platform authenticator
    if (
      PublicKeyCredential &&
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !==
        'function'
    ) {
      this.markPlatformAuthenticatorUnavailable();
    } else if (
      PublicKeyCredential &&
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
        'function'
    ) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          if (!available) {
            this.markPlatformAuthenticatorUnavailable();
          }
        })
        .catch((e) => {
          this.markPlatformAuthenticatorUnavailable();
        });
    }
  }

  performMakeCredReq = (makeCredReq: any) => {
    makeCredReq.challenge = this.base64UrlDecode(makeCredReq.challenge);
    makeCredReq.user.id = this.base64UrlDecode(makeCredReq.user.id);

    //Base64url decoding of id in excludeCredentials
    if (makeCredReq.excludeCredentials instanceof Array) {
      for (let i of makeCredReq.excludeCredentials) {
        if ('id' in i) {
          i.id = this.base64UrlDecode(i.id);
        }
      }
    }

    delete makeCredReq.status;
    delete makeCredReq.errorMessage;
    // delete makeCredReq.authenticatorSelection;

    this.removeEmpty(makeCredReq);

    this.logObject('Updating credentials ', makeCredReq);
    return makeCredReq;
  };

  performGetCredReq = (getCredReq: any) => {
    getCredReq.challenge = this.base64UrlDecode(getCredReq.challenge);

    //Base64url decoding of id in allowCredentials
    if (getCredReq.allowCredentials instanceof Array) {
      for (let i of getCredReq.allowCredentials) {
        if ('id' in i) {
          i.id = this.base64UrlDecode(i.id);
        }
      }
    }

    delete getCredReq.status;
    delete getCredReq.errorMessage;

    this.removeEmpty(getCredReq);

    this.logObject('Updating credentials ', getCredReq);
    return getCredReq;
  };

  disableControls(): void {
    this.isRegBtnShow = true;
    this.isAuthenticateBtnShow = true;
    this.isStatusMsgShow = false;
  }

  /**
   * Enables all input controls and buttons on the page
   */
  enableControls(): void {
    this.isRegBtnShow = false;
    this.isAuthenticateBtnShow = false;
    this.isStatusMsgShow = true;
  }

  markPlatformAuthenticatorUnavailable(): void {
    this.isSupportAttachmentPlatform = false;
  }

  removeEmpty(obj: any): void {
    for (let key in obj) {
      if (obj[key] == null || obj[key] === '') {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        this.removeEmpty(obj[key]);
      }
    }
  }

  /**
   * Base64 url decode
   * @param {String} base64url
   */
  base64UrlDecode(base64url: any) {
    let input = base64url.replace(/-/g, '+').replace(/_/g, '/');
    let diff = input.length % 4;
    if (!diff) {
      while (diff) {
        input += '=';
        diff--;
      }
    }

    return Uint8Array.from(atob(input), (c) => c.charCodeAt(0));
  }

  logObject(name: any, object: any): void {
    console.log(name + ': ' + JSON.stringify(object));
  }
}
