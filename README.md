# cf-workers-utils
![Code style: Prettier](https://img.shields.io/badge/code_style-Prettier-blue?style=for-the-badge)
![License: MIT](https://img.shields.io/github/license/Kynson/cf-workers-utils?style=for-the-badge)
[![NPM Version](https://img.shields.io/npm/v/cf-workers-utils?style=for-the-badge&logo=npm)](https://npmjs.com/cf-workers-utils)

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

### Router
A itty-router like tiny router. It is designed to be a smaller version of [IttyRouter](https://itty.dev/itty-router/routers/ittyrouter), currently sized ~370 bytes when minified.

#### Difference between `Router` and `IttyRouter`
* `Router.fetch` requires a standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object instead of `RequestLike`.
* `Router` uses [URL Pattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) for route pattern matching instead of regex.
* Parsed URL is available under `request.parsedURL` in `Router`. It is the value returned by `URLPattern.exec(url)`, where `url` is the URL of the incoming request (i.e. `request.url`).
* `params` and `query` is not available in `Router` route handlers.

#### createRouter<R, A, C>(base?: string): Router<R, A, C>
Creates an itty-router like tiny router.

* `base` Base URL of the router. If omitted, all patterns must be a full URL.

* `R` The type of request with any additional properities to be defined on it, e.g., properities that will be injected by middleware.
* `A` (`AdditionalArguments`) An array or a tuple indicating the type of any additional arguments to be passed to the route handlers. For example if you would like to pass a `string` and `number` as additional arguments to the route handlers, pass in `[string, number]`.
* `C` (`CustomMethod`) An union of any custom methods that are not included in the default type.

Returns the created router.

#### Router.<methodName>(pattern: string, ..handlers: (request: R, ...additionalArguments: A) => unknown): Router<R, A, C>
Registers a route which match request with method `methodName` and URL matches `pattern`.

* `pattern` A pattern to be used to match the URL of the incoming request. See [URL Pattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API#pattern_syntax) for syntax.
* `handlers` Handlers which process the matched request. Handlers can act as a middleware and modify the `request` object. Returing a truthy value from a handler will prevent any handlers following it from executing and the value will be used as the returning value of `Router.fetch`.
* `request` The incomming request. It contains an extra field `parsedURL`.
* `additionalArguments` Additional arguments passed to `Router.fetch`.

Returns `Router` for chaining.

#### Router.fetch(request: R,  ...additionalArguments: A): Promise<unknown>
Handles an incoming fetch event.

* `request` An incoming request. Can be extended by middlewares.
* `additionalArguments`Additional arguments to be passed to the registered handlers (e.g. environment bindings).

Returns the return value of the first handler returning a truthy value.

#### Example
```typescript
import type { Router, ExtendedRequest } from 'cf-workers-utils/router';
import { createRouter } from 'cf-workers-utils/router';

const router = createRouter<ExtendedRequest, [string]>('https://base.com');

const middleware = (request: ExtendedRequest, additionalArgument: string) => {
  if (request.parsedURL?.pathname.groups.id === 'private') {
    return `ID is private. Additional argument: ${additionalArgument}`;
  }
}

router.get('/foo/:id', middleware, () => 'hello world!');

// Resolves to 'ID is private. Additional argument: extra value'
await router.fetch(new Request('https://base.com/foo/private'), 'extra value');
```

You may refer to the [itty-router docs](https://itty.dev/docs) for more examples.