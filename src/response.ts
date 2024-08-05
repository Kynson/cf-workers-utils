/**
 * Creates a `Response`
 * @param body The body to be used in the response, `null` if no body is needed
 * @param status The status code to be used in the response. Defaults to 200
 * @param additionalHeaders Additional headers to be used int the response. `'Content-Type': 'application/json'` will be added automatically if `body` is not null
 * @returns The created `Response`, either a JSON response or an empty response
 */
export function createResponse(
  body: Record<string, unknown> | null,
  status = 200,
  additionalHeaders: Record<string, string> = {},
) {
  const bodyInit = body ? JSON.stringify(body) : null;

  return new Response(bodyInit, {
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...additionalHeaders,
    },
    status,
  });
}

/**
 * Creates a `Response` from an `Error`
 * @param error The error to be used to create the response. Its name and message will be included
 * @param status The status code to be used in the response. Defaults to 500
 * @param additionalHeaders Additional headers to be used int the response. `'Content-Type': 'application/json'` is always added
 * @returns The created `Response`, must be a JSON response
 */
export function createResponseFromError(
  error: Error,
  status = 500,
  additionalHeaders: Record<string, string> = {},
) {
  const { name, message } = error;

  return createResponse(
    { errorCode: name, errorMessage: message },
    status,
    additionalHeaders,
  );
}
