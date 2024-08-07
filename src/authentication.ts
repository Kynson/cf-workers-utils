import {
  isBase64URL,
  base64URLToUint8Array,
  stringToUint8Array,
} from './binary';

/**
 * Converts the `RangeError` thrown by `base64URLToUintArray()` by updating its error message
 * @param error An errror thrown by `base64URLToUint8Array()`
 * @param argumentName The name of the argument which caused the RangeError
 * @returns The converted Error
 */
function convertBase64URLToUint8ArrayError(
  error: unknown,
  argumentName: string,
) {
  if (!(error instanceof RangeError)) {
    return error;
  }

  const updatedErrorMessage = error.message.replace('string', argumentName);

  return new RangeError(updatedErrorMessage);
}

/**
 * Verifies a token with a expected token hash
 * @param token The token to be verified. Must be base64URL-encoded
 * @param expectedTokenHash The expected SHA-512 hash of the token. Must be base64URL-encoded
 * @returns Whether the token matches the expected hash
 */
export async function verifyToken(token: string, expectedTokenHash: string) {
  if (!isBase64URL(token)) {
    throw new RangeError(
      'token is empty or contains character not in the base64URL character set',
    );
  }

  // token must not contain non-Latain1 character at this point
  const tokenBufferView = stringToUint8Array(token);
  const tokenHash = await crypto.subtle.digest('SHA-512', tokenBufferView);

  let expectedTokenHashBufferView: Uint8Array;
  try {
    expectedTokenHashBufferView = base64URLToUint8Array(expectedTokenHash);
  } catch (error) {
    throw convertBase64URLToUint8ArrayError(error, 'expectedTokenHash');
  }

  if (expectedTokenHashBufferView.length !== 64) {
    throw new RangeError('expectedTokenHash is not 64 bytes');
  }

  return crypto.subtle.timingSafeEqual(tokenHash, expectedTokenHashBufferView);
}

/**
 * Verifies a signature of some data using a public key. Uses ECDSA with P-521 curve and SHA-512 hash
 * @param data The data to be verified
 * @param signature The signature to be verified. Must be base64URL-encoded
 * @param publicKey The public key used for verification. Must be an ECDSA P-521 JSON Web Key (JWK) string
 * @returns Whether the signature is valid
 */
export async function verifySignature(
  data: ArrayBuffer | ArrayBufferView,
  signature: string,
  publicKey: string,
) {
  let signatureBufferView: Uint8Array;
  try {
    signatureBufferView = base64URLToUint8Array(signature);
  } catch (error) {
    throw convertBase64URLToUint8ArrayError(error, 'signature');
  }

  const publicJSONWebKey = JSON.parse(publicKey) as JsonWebKey;
  const publicCryptoKey = await crypto.subtle.importKey(
    'jwk',
    publicJSONWebKey,
    { name: 'ECDSA', namedCurve: 'P-521' },
    false,
    ['verify'],
  );

  return crypto.subtle.verify(
    {
      name: 'ECDSA',
      hash: 'SHA-512',
    },
    publicCryptoKey,
    signatureBufferView,
    data,
  );
}

/**
 * Verifies a signed URL. Uses ECDSA with P-521 curve and SHA-512 hash
 * @param url The URL to be verified. The signature should be included in the `sig` serach parameter
 * @param publicKey The public key used for verification. Must be a JSON Web Key (JWK) string
 * @returns Whether the URL's signature is valid
 */
export async function verifySignedURL(url: string, publicKey: string) {
  // This will ensure all non-Latain1 characters encoded correctly
  const parsedURL = new URL(url);
  const signature = parsedURL.searchParams.get('sig');

  if (!signature) {
    throw new TypeError('signature is null');
  }

  parsedURL.searchParams.delete('sig');

  const parsedURLBufferView = stringToUint8Array(parsedURL.href);

  return verifySignature(parsedURLBufferView, signature, publicKey);
}
