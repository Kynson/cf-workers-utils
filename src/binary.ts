export function isBase64URL(string: string) {
  return /^[0-9A-Za-z_-]+$/.test(string);
}

/**
 * Converts an `Uint8Array` into an ASCII string
 * @param bufferView The `Uint8Array` to be converted
 * @returns The converted ASCII string
 *
 * SAFETY: There is no runtime check to ensure the inputted argument is an `Uint8Array`.
 * Any array element larger than 255 may produce unexpected result.
 * Don't use this function to process untrusted user input.
 */
export function uint8ArrayToString(bufferView: Uint8Array) {
  return String.fromCharCode(...bufferView);
}

/**
 * Convert an ASCII string into an `Uint8Array`
 * @param string The ASCII string to be converted
 * @returns The converted `Uint8Array`
 * @throws `RangeError` if the string contains non-ASCII character (code point higher than 255)
 */
export function stringToUint8Array(string: string) {
  return Uint8Array.from<string>(string, (character) => {
    const codePoint = character.charCodeAt(0);

    if (codePoint > 255) {
      throw new RangeError(
        'string contains character with code point higher than 255',
      );
    }

    return codePoint;
  });
}

/**
 * Converts an `Uint8Array` into a base64URL-encoded string
 * @param bufferView The `Uint8Array` to be converted
 * @returns The converted base64URL-encoded string
 *
 * SAFETY: There is no runtime check to ensure the inputted argument is an `Uint8Array`.
 * Any array element larger than 255 may produce unexpected result.
 * Don't use this function to process untrusted user input.
 */
export function uint8ArrayToBase64URL(bufferView: Uint8Array) {
  return btoa(uint8ArrayToString(bufferView))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

/**
 * Convert an base64URL-encoded string into an `Uint8Array`
 * @param string The base64URL-encoded string to be converted
 * @returns The converted `Uint8Array`
 * @throws `RangeError` if the string is empty or contains character not in the base64URL character set (i.e. does not match `/^[0-9A-Za-z_-]+$/`)
 */
export function base64URLToUint8Array(string: string) {
  if (!isBase64URL(string)) {
    throw new RangeError(
      'string is empty or contains character not in the base64URL character set',
    );
  }

  const base64String = atob(string.replaceAll('-', '+').replaceAll('_', '/'));

  return stringToUint8Array(base64String);
}
