# cf-workers-utils
![Code style: Prettier](https://img.shields.io/badge/code_style-Prettier-blue?style=for-the-badge)
![License: MIT](https://img.shields.io/github/license/Kynson/cf-workers-utils?style=for-the-badge)
![NPM Version](https://img.shields.io/npm/v/cf-workers-utils?style=for-the-badge&logo=npm)

## Overview
This package provides opinionated utility functions for creating responses, authentication and binary data manipulation, designed to be used with [Cloudflare Workers](https://workers.cloudflare.com/).

> [!NOTE]
> **This package is opinionated!** The choice of cryptographic algorithms, output format, etc. are not configurable. This package is more suitable for developers who would like to save time on writing boilerplates and don't have requirements on how the function is implemented/ its output format. Please read the documentation below before deciding to use this package whether or not.

## Installation
```bash
npm install cf-workers-utils
```
## Usage
### Authentication
#### verifyToken(token: string, expectedTokenHash: string): Promise<boolean>
Verifies a token with a expected token hash.

* `token` The token to be verified. Must be base64URL-encoded.
* `expectedTokenHash` The expected SHA-512 hash of the token. Must be base64URL-encoded.

Returns whether the token matches the expected hash.

#### verifySignature(data: ArrayBuffer | ArrayBufferView, signature: string, publicKey: string): Promise<boolean>
Verifies a signature of some data using a public key. Uses ECDSA with P-521 curve and SHA-512 hash.

* `data` The data to be verified.
* `signature` The signature to be verified. Must be base64URL-encoded.
* `publicKey` The public key used for verification. Must be an ECDSA P-521 JSON Web Key (JWK) string.

Returns whether the signature is valid.

#### verifySignedURL(url: string, publicKey: string): Promise<boolean>
Verifies a signed URL. Uses ECDSA with P-521 curve and SHA-512 hash.

* `url` The URL to be verified. The signature should be included in the `sig` serach parameter.
* `publicKey` The public key used for verification. Must be an ECDSA P-521 JSON Web Key (JWK) string.

Returns whether the URL's signature is valid.

### Binary Data Manipulation
#### isBase64URL(string: string): boolean
Checks if the inputted string is a valid base64URL string.

* `string` The string to be checked.

Returns whether the string is a valid base64URL string.

#### uint8ArrayToString(bufferView: Uint8Array): string
Converts an `Uint8Array` into a Latin1 string.

* `bufferView` The `Uint8Array` to be converted.

Returns The converted Latin1 string.\
Throws `TypeError` if bufferView is not an `Uint8Array`.

#### stringToUint8Array(string: string): Uint8Array
Convert a Latin1 string into an `Uint8Array`.

* `string` The Latin1 string to be converted.

Returns the converted `Uint8Array`.\
Throws `RangeError` if the string contains non-Latin1 character (code point higher than 255).

#### uint8ArrayToBase64URL(bufferView: Uint8Array): string
Converts an `Uint8Array` into a base64URL-encoded string.

* `bufferView` The `Uint8Array` to be converted.

Returns the converted base64URL-encoded string.

#### base64URLToUint8Array(string: string): Uint8Array
Convert an base64URL-encoded string into an `Uint8Array`.

* `string` The base64URL-encoded string to be converted.
Returns the converted `Uint8Array`.\
Throws `RangeError` if the string is empty or contains character not in the base64URL character set (i.e. does not match `/^[0-9A-Za-z_-]+$/`).

### Response Creation

#### createResponse(body: Record<string, unknown> | null, status = 200, additionalHeaders: Record<string, string> = {}): Response
Creates a `Response`.

* `body` The body to be used in the response, `null` if no body is needed.
* `status` The status code to be used in the response. Defaults to 200.
* `additionalHeaders` Additional headers to be used int the response. `'Content-Type': 'application/json'` will be added automatically if `body` is not null.

Returns the created `Response`, either a JSON response or an empty response.

#### createResponseFromError(error: Error, status = 500, additionalHeaders: Record<string, string> = {}): Response
Creates a `Response` from an `Error`.

* `error` The error to be used to create the response. Its name and message will be included.
* `status` The status code to be used in the response. Defaults to 500.
* `additionalHeaders` Additional headers to be used int the response. `'Content-Type': 'application/json'` is always added.

Returns The created `Response`, must be a JSON response in the folowing format:

```json
{
  "errorCode": "<value of error.name>",
  "errorMessage": "<value of error.message>"
}
```