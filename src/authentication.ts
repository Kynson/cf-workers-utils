import {
  isBase64URL,
  base64URLToUint8Array,
  stringToUint8Array,
} from './binary';

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
