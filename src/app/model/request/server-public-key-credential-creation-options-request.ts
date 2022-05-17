export interface ServerPublicKeyCredentialCreationOptionsRequest {
  username: string;
  displayName: string;
  attestation: string;
  authenticatorSelection?: AuthenticatorSelection | {},
  credProtect?: CredProtect | {},
}

interface AuthenticatorSelection {
  requireResidentKey: boolean;
  userVerification: string;
  authenticatorAttachment: string;
}

interface CredProtect {
  credentialProtectionPolicy: string;
  enforceCredentialProtectionPolicy: boolean;
}
