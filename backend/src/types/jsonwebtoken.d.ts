// ============================================================================
// Type declaration for jsonwebtoken (locally provided because npm workspace
// hoisting prevents @types/jsonwebtoken from resolving in backend/).
// ============================================================================

declare module 'jsonwebtoken' {
  /**
   * Verify a JWT token and return the decoded payload.
   * Synchronous variant used in Socket.io middleware.
   */
  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: object,
  ): Record<string, unknown>;

  /**
   * Sign a JWT token.
   */
  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    options?: object,
  ): string;

  export type Algorithm =
    | 'HS256'
    | 'HS384'
    | 'HS512'
    | 'RS256'
    | 'RS384'
    | 'RS512'
    | 'ES256'
    | 'ES384'
    | 'ES512'
    | 'PS256'
    | 'PS384'
    | 'PS512'
    | 'none';

  export interface SignOptions {
    algorithm?: Algorithm;
    expiresIn?: string | number;
    notBefore?: string | number;
    audience?: string | string[];
    issuer?: string;
    jwtid?: string;
    subject?: string;
    noTimestamp?: boolean;
    header?: object;
    keyid?: string;
  }

  export interface VerifyOptions {
    algorithms?: Algorithm[];
    audience?: string | RegExp | Array<string | RegExp>;
    clockTimestamp?: number;
    clockTolerance?: number;
    complete?: boolean;
    issuer?: string | string[];
    ignoreExpiration?: boolean;
    ignoreNotBefore?: boolean;
    subject?: string;
    maxAge?: string | number;
  }

  export interface JwtPayload {
    [key: string]: unknown;
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
  }
}
