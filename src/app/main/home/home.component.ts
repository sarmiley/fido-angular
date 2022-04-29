import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  isRegBtnShow = false;
  isAuthenticateBtnShow = false;
  isShowStatusMSg = false;
  isSupportAttachmentPlatform = true;

  ishiddenRegSpinner = true;
  ishiddenAuthSpinner = true

  abortController = new AbortController();
  abortSignal = this.abortController.signal;

  username = '';
  displayName = '';

  statusText = '';

  specifyAuthenticatorSelection: boolean = true;

  specifyAuthenticatorAttachment: boolean = true;
  attachment: string = 'platform'; // optional

  userVerificationRequired: string = 'preferred';

  requireResidentKey: boolean = false; // default to false

  specifyAttestationConvenyance: boolean = true;
  attestation: string = 'none'; // default to none

  enableCredProtect: boolean = false;

  enforceCredentialProtectionPolicy: boolean = false;
  credentialProtectionPolicy: string = 'userVerificationOptional';

  constructor() { }

  ngOnInit(): void {
    this.checkPublicKeyCredIsAvailable();
  }

  registerButtonClicked(): void {
    console.log('rrrr');
    if (this.username === '') {
      this.statusText = 'Input user name first';
      this.isShowStatusMSg = true;
      return;
    }
    if (this.displayName === '') {
      this.statusText = 'Input display name first';
      this.isShowStatusMSg = true;
      return;
    }

    this.disableControls();
    this.ishiddenRegSpinner = true;

    let serverPublicKeyCredentialCreationOptionsRequest = {
      username: this.username,
      displayName: this.displayName,
      authenticatorSelection: {},
      attestation: this.specifyAttestationConvenyance ? this.attestation : {},
      credProtect: this.enableCredProtect
        ? {
          credentialProtectionPolicy: this.credentialProtectionPolicy,
          enforceCredentialProtectionPolicy:
            this.enforceCredentialProtectionPolicy ?? null,
        }
        : {},
    };

    if (this.specifyAuthenticatorSelection) {
      let authenticatorSelection = {
        requireResidentKey: this.requireResidentKey,
        userVerification: this.userVerificationRequired,
        authenticatorAttachment: this.specifyAuthenticatorAttachment
          ? this.attachment
          : null,
      };
      // set authenticator attachment
      // if (this.specifyAuthenticatorAttachment) {
      //   authenticatorSelection.authenticatorAttachment = this.attachment;
      // }
      serverPublicKeyCredentialCreationOptionsRequest.authenticatorSelection =
        authenticatorSelection;
    }

    // set attestation conveyance preference
    // if (this.specifyAttestationConvenyance) {
    //   serverPublicKeyCredentialCreationOptionsRequest.attestation = this.attestation;
    // }

    // if (this.enableCredProtect) {
    //   serverPublicKeyCredentialCreationOptionsRequest.credProtect = {
    //     credentialProtectionPolicy: this.credentialProtectionPolicy,
    //     enforceCredentialProtectionPolicy: this.enforceCredentialProtectionPolicy ?? null
    //   };
    // }

    this.getRegChallenge(serverPublicKeyCredentialCreationOptionsRequest)
      .then((createCredentialOptions) => {
        return this.createCredential(createCredentialOptions);
      })
      .then(() => {
        this.statusText = 'Successfully created credential';
        this.ishiddenRegSpinner = true;
        this.enableControls();
      })
      .catch((e) => {
        this.statusText = 'Error: ' + e;
        this.ishiddenRegSpinner = true;

        this.enableControls();
      });
  }


  authenticateButtonClicked() {
    this.disableControls();
    this.ishiddenAuthSpinner = false;

    // prepare parameter
    let serverPublicKeyCredentialGetOptionsRequest = {
      username: this.username,
      userVerification: this.userVerificationRequired
    };

    this.getAuthChallenge(serverPublicKeyCredentialGetOptionsRequest)
      .then(getCredentialOptions => {
        return this.getAssertion(getCredentialOptions);
      })
      .then(() => {
        this.statusText = `Successfully verified credential`;
        this.ishiddenAuthSpinner = true;
        this.enableControls()
      }).catch(e => {
        this.statusText = "Error: " + e;
        this.ishiddenAuthSpinner = true;
        this.isShowStatusMSg = true;
        this.enableControls()
      });
  }


  getRegChallenge(serverPublicKeyCredentialCreationOptionsRequest: any) {
    this.logObject(
      'Get reg challenge',
      serverPublicKeyCredentialCreationOptionsRequest
    );
    return this.rest_post(
      '/attestation/options',
      serverPublicKeyCredentialCreationOptionsRequest
    ).then((response) => {
      this.logObject('Get reg challenge response', response);
      if (response.status !== 'ok') {
        return Promise.reject(response.errorMessage);
      } else {
        let createCredentialOptions = this.performMakeCredReq(response);
        return Promise.resolve(createCredentialOptions);
      }
    });
  }

  getAuthChallenge(serverPublicKeyCredentialGetOptionsRequest: any) {
    this.logObject("Get auth challenge", serverPublicKeyCredentialGetOptionsRequest);
    return this.rest_post("/assertion/options", serverPublicKeyCredentialGetOptionsRequest)
      .then(response => {
        this.logObject("Get auth challenge", response);
        if (response.status !== 'ok') {
          return Promise.reject(response.errorMessage);
        } else {
          let getCredentialOptions = this.performGetCredReq(response);
          return Promise.resolve(getCredentialOptions);
        }
      });
  }

  rest_post(endpoint: any, object: any) {
    return fetch(endpoint, {
      method: 'POST',
      credentials: 'same-origin',
      body: JSON.stringify(object),
      headers: {
        'content-type': 'application/json',
      },
    }).then((response) => {
      return response.json();
    });
  }

  rest_put(endpoint: any, object: any) {
    return fetch(endpoint, {
      method: "PUT",
      credentials: "same-origin",
      body: JSON.stringify(object),
      headers: {
        "content-type": "application/json"
      }
    })
      .then(response => {
        return response.json();
      });
  }


  createCredential(options: any) {
    if (
      !PublicKeyCredential ||
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !==
      'function'
    ) {
      return Promise.reject(
        'WebAuthn APIs are not available on this user agent.'
      );
    }

    return navigator.credentials
      .create({ publicKey: options, signal: this.abortSignal })
      .then((rawAttestation: any) => {
        this.logObject('raw attestation', rawAttestation);

        let attestation = {
          rawId: this.base64UrlEncode(rawAttestation?.rawId),
          id: this.base64UrlEncode(rawAttestation?.rawId),
          response: {
            clientDataJSON: this.base64UrlEncode(
              rawAttestation.response.clientDataJSON
            ),
            attestationObject: this.base64UrlEncode(
              rawAttestation.response.attestationObject
            ),
            transports: (typeof rawAttestation.response.getTransports === 'function') ? rawAttestation.response.getTransports() : null
          },
          type: rawAttestation.type,
          extensions: rawAttestation.getClientExtensionResult ? rawAttestation.getClientExtensionResults() : {},
        };

        // if (rawAttestation.getClientExtensionResults) {
        //   attestation.extensions = rawAttestation.getClientExtensionResults();
        // }

        // set transports if it is available
        // if (typeof rawAttestation.response.getTransports === 'function') {
        //   attestation.response.transports =
        //     rawAttestation.response.getTransports();
        // }

        console.log('=== Attestation response ===');
        this.logVariable('rawId (b64url)', attestation.rawId);
        this.logVariable('id (b64url)', attestation.id);
        this.logVariable(
          'response.clientDataJSON (b64url)',
          attestation.response.clientDataJSON
        );
        this.logVariable(
          'response.attestationObject (b64url)',
          attestation.response.attestationObject
        );
        this.logVariable(
          'response.transports',
          attestation.response.transports
        );
        this.logVariable('id', attestation.type);

        return this.rest_post('/attestation/result', attestation);
      })
      .catch(function (error) {
        console.log('create credential error: ' + error);
        if (error == 'AbortError') {
          console.info('Aborted by user');
        }
        return Promise.reject(error);
      })
      .then((response) => {
        if (response.status !== 'ok') {
          return Promise.reject(response.errorMessage);
        } else {
          return Promise.resolve(response);
        }
      });
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

  getAssertion(options: any) {
    if (!PublicKeyCredential) {
      return Promise.reject("WebAuthn APIs are not available on this user agent.");
    }

    return navigator.credentials.get({ publicKey: options, signal: this.abortSignal })
      .then((rawAssertion: any) => {
        this.logObject("raw assertion", rawAssertion);

        let assertion = {
          rawId: this.base64UrlEncode(rawAssertion?.rawId),
          id: this.base64UrlEncode(rawAssertion?.rawId),
          response: {
            clientDataJSON: this.base64UrlEncode(rawAssertion?.response?.clientDataJSON),
            userHandle: this.base64UrlEncode(rawAssertion?.response?.userHandle),
            signature: this.base64UrlEncode(rawAssertion?.response.signature),
            authenticatorData: this.base64UrlEncode(rawAssertion?.response.authenticatorData)
          },
          type: rawAssertion?.type,
          extensions: rawAssertion.getClientExtensionResults ? rawAssertion.getClientExtensionResults() : {}
        };

        // if (rawAssertion.getClientExtensionResults) {
        //     assertion.extensions = rawAssertion.getClientExtensionResults();
        // }

        console.log("=== Assertion response ===");
        this.logVariable("rawId (b64url)", assertion.rawId);
        this.logVariable("id (b64url)", assertion.id);
        this.logVariable("response.userHandle (b64url)", assertion.response.userHandle);
        this.logVariable("response.authenticatorData (b64url)", assertion.response.authenticatorData);
        this.logVariable("response.lientDataJSON", assertion.response.clientDataJSON);
        this.logVariable("response.signature (b64url)", assertion.response.signature);
        this.logVariable("id", assertion.type);

        return this.rest_post("/assertion/result", assertion);
      })
      .catch(function (error) {
        console.log('get assertion error: ' + error);
        if (error == "AbortError") {
          console.info("Aborted by user");
        }
        return Promise.reject(error);
      })
      .then(response => {
        if (response.status !== 'ok') {
          return Promise.reject(response.errorMessage);
        } else {
          return Promise.resolve(response);
        }
      });
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
    this.isShowStatusMSg = false;
  }

  /**
   * Enables all input controls and buttons on the page
   */
  enableControls(): void {
    this.isRegBtnShow = false;
    this.isAuthenticateBtnShow = false;
    this.isShowStatusMSg = true;
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

  base64UrlEncode(arrayBuffer: any = '') {
    if (!arrayBuffer || arrayBuffer.length == 0) {
      return undefined;
    }

    return btoa(
      String.fromCharCode.apply(null, new Uint8Array(arrayBuffer) as any)
    )
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  logObject(name: any, object: any): void {
    console.log(name + ': ' + JSON.stringify(object));
  }

  logVariable(name: any, text: any) {
    console.log(name + ': ' + text);
  }
}
