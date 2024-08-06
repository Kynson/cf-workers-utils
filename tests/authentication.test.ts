import { expect, test } from 'vitest';

import {
  verifyToken,
  verifySignature,
  verifySignedURL,
} from '../src/authentication';
import { stringToUint8Array, uint8ArrayToBase64URL } from '../src/binary';

async function generateToken(generateValidToken = true) {
  const bufferView = crypto.getRandomValues(new Uint8Array(32));

  // This is what the user should provided
  const token = uint8ArrayToBase64URL(bufferView);
  const tokenBufferView = stringToUint8Array(token);

  const expectedTokenHashBufferView = new Uint8Array(
    await crypto.subtle.digest('SHA-512', tokenBufferView),
  );
  // Modify the first byte
  expectedTokenHashBufferView[0] += generateValidToken ? 0 : 1;

  // This is what the verification system should store
  const expectedTokenHash = uint8ArrayToBase64URL(expectedTokenHashBufferView);

  return { token, expectedTokenHash };
}

async function generateCryptoKeyPair() {
  return (await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-521' },
    true,
    ['verify', 'sign'],
  )) as CryptoKeyPair;
}

async function prepareSignatureTestData(
  data: ArrayBuffer | ArrayBufferView,
  generateValidSignature = true,
) {
  const { publicKey: publicCryptoKey, privateKey: privateCryptoKey } =
    await generateCryptoKeyPair();
  // This is what the verification system should store
  const publicJSONWebKey = JSON.stringify(
    await crypto.subtle.exportKey('jwk', publicCryptoKey),
  );

  const signatureBufferView = new Uint8Array(
    await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-512' },
      privateCryptoKey,
      data,
    ),
  );
  // Modify the first byte
  signatureBufferView[0] += generateValidSignature ? 0 : 1;
  // This is what the user should provide
  const signature = uint8ArrayToBase64URL(signatureBufferView);

  return { publicJSONWebKey, signature };
}

test('verifyToken should reject token with invalid format', () => {
  const token = 'Test/F9+';
  const expectedTokenHash = 'Test_valid';

  expect(verifyToken(token, expectedTokenHash)).rejects.toStrictEqual(
    new RangeError(
      'token is empty or contains character not in the base64URL character set',
    ),
  );
});

test('verifyToken should reject expectedTokenHash with invalid format', () => {
  const token = 'Test_-F9';
  const expectedTokenHash = 'Test/F9+';

  expect(verifyToken(token, expectedTokenHash)).rejects.toStrictEqual(
    new RangeError(
      'expectedTokenHash is empty or contains character not in the base64URL character set',
    ),
  );
});

test('verifyToken should reject expectedTokenHash with invalid length', () => {
  const token = 'Test_-F9';
  const expectedTokenHash = 'Test_not_64_bytes_';

  expect(verifyToken(token, expectedTokenHash)).rejects.toStrictEqual(
    new RangeError('expectedTokenHash is not 64 bytes'),
  );
});

// This test is only valid when uint8ArrayToBase64URL and stringToUint8Array pass all tests
test('verifyToken should accept valid token', async () => {
  const { token, expectedTokenHash } = await generateToken();

  expect(verifyToken(token, expectedTokenHash)).resolves.toBe(true);
});

// This test is only valid when uint8ArrayToBase64URL and stringToUint8Array pass all tests
test('verifyToken should reject invalid token', async () => {
  const { token, expectedTokenHash } = await generateToken(false);

  expect(verifyToken(token, expectedTokenHash)).resolves.toBe(false);
});

test.each(['Test_invalid$', ''])(
  'verifySignature should reject signature "%s" with invalid format',
  async (signature) => {
    const data = crypto.getRandomValues(new Uint8Array(32));

    const { publicKey: publicCryptoKey } = await generateCryptoKeyPair();
    const publicJSONWebKey = JSON.stringify(
      await crypto.subtle.exportKey('jwk', publicCryptoKey),
    );

    expect(verifySignature(data, signature, publicJSONWebKey)).rejects.toBe(
      new RangeError(
        'signature is empty or contains character not in the base64URL character set',
      ),
    );
  },
);

// This test is only valid when uint8ArrayToBase64URL passes all tests
test('verifySignature should accept valid signature', async () => {
  const data = crypto.getRandomValues(new Uint8Array(32));

  const { signature, publicJSONWebKey } = await prepareSignatureTestData(data);

  expect(verifySignature(data, signature, publicJSONWebKey)).resolves.toBe(
    true,
  );
});

// This test is only valid when uint8ArrayToBase64URL passes all tests
test('verifySignature should reject invalid signature', async () => {
  const data = crypto.getRandomValues(new Uint8Array(32));

  const { signature, publicJSONWebKey } = await prepareSignatureTestData(
    data,
    false,
  );

  expect(verifySignature(data, signature, publicJSONWebKey)).resolves.toBe(
    false,
  );
});

test('verifySignedURL should reject URL without signature', async () => {
  const url = 'https://test.com';

  const { publicKey: publicCryptoKey } = await generateCryptoKeyPair();
  const publicJSONWebKey = JSON.stringify(
    await crypto.subtle.exportKey('jwk', publicCryptoKey),
  );

  expect(verifySignedURL(url, publicJSONWebKey)).rejects.toBe(
    new TypeError('signature is null'),
  );
});

// This test is only valid when uint8ArrayToBase64URL passes all tests
test('verifySignedURL should accept URL with valid signature', async () => {
  const url = new URL(`https://test.com/foo?r=${Math.random().toString()}`);

  const { signature, publicJSONWebKey } = await prepareSignatureTestData(
    stringToUint8Array(url.href),
  );

  url.searchParams.append('sig', signature);

  expect(verifySignedURL(url.href, publicJSONWebKey)).resolves.toBe(true);
});
