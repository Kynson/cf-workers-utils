import { expect, test } from 'vitest';

import {
  isBase64URL,
  uint8ArrayToString,
  stringToUint8Array,
  uint8ArrayToBase64URL,
  base64URLToUint8Array,
} from '../src/binary';

test.each([
  ['QQ', true],
  ['QQ_-test-123', true],
  ['test-123/@==', false],
  ['test-non-latin1-Ā', false],
  ['', false],
])('isBase64URL("%s") should be %j', (string, expectedResult) => {
  expect(isBase64URL(string)).toBe(expectedResult);
});

test('stringToUint8Array should reject string contains character with code point higher than 255', () => {
  const string = String.fromCharCode(256);
  expect(() => stringToUint8Array(string)).toThrowError(
    new RangeError('string contains character with code point higher than 255'),
  );
});

test('uint8ArrayToString and stringToUint8Array should be a pair of inverse functions', () => {
  const bufferView = new Uint8Array(32);
  crypto.getRandomValues(bufferView);

  const encodedString = uint8ArrayToString(bufferView);
  const decodedBuffer = stringToUint8Array(encodedString);

  expect(decodedBuffer).toStrictEqual(bufferView);
});

test('uint8ArrayToBase64URL should reject non-Uint8Array bufferView', () => {
  // Override the type to force TS to accept this for testing
  const bufferView = new Uint16Array(32) as unknown as Uint8Array;
  crypto.getRandomValues(bufferView);

  expect(() => uint8ArrayToBase64URL(bufferView)).toThrowError(
    new TypeError('bufferView is not Uint8Array'),
  );
});

// This test only valid when isBase64URL passes all tests
test('uint8ArrayToBase64URL should return string with correct fromat', () => {
  const bufferView = new Uint8Array(32);
  crypto.getRandomValues(bufferView);

  expect(isBase64URL(uint8ArrayToBase64URL(bufferView))).toBe(true);
});

test.each(['Test_With-invalid_char@1', ''])(
  'base64URLToUint8Array should reject string "%s" as its format is invalid',
  (string) => {
    expect(() => base64URLToUint8Array(string)).toThrowError(
      new RangeError(
        'string is empty or contains character not in the base64URL character set',
      ),
    );
  },
);

test.each([36, 32])(
  'uint8ArrayToBase64URL and base64URLToUint8Array should be a pair of inverse functions (input length: %i)',
  (length) => {
    const bufferView = new Uint8Array(length);
    crypto.getRandomValues(bufferView);

    const encodedString = uint8ArrayToBase64URL(bufferView);
    const decodedBuffer = base64URLToUint8Array(encodedString);

    expect(decodedBuffer).toStrictEqual(bufferView);
  },
);
