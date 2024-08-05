import { expect, test } from 'vitest';

import { createResponse, createResponseFromError } from '../src/response';

test('createResponse creates a correct response from empty body', () => {
  const response = createResponse(null);

  expect(response.text()).resolves.toBe('');
  expect(response.status).toBe(200);
});

test('createResponse creates a correct response from status code', () => {
  const status = 204;
  const response = createResponse(null, status);

  expect(response.text()).resolves.toBe('');
  expect(response.status).toBe(status);
  expect(response.headers).toStrictEqual(new Headers());
});

test('createResponse creates a correct response with additional headers', () => {
  const additionalHeaders = {
    'X-Test': Math.random().toString(),
  };
  const status = 204;
  const response = createResponse(null, status, additionalHeaders);

  expect(response.text()).resolves.toBe('');
  expect(response.status).toBe(status);
  expect(response.headers).toStrictEqual(new Headers(additionalHeaders));
});

test('createResponse creates a correct JSON response', () => {
  const body = {
    testValue: Math.random(),
  };
  const response = createResponse(body);

  expect(response.json()).resolves.toStrictEqual(body);
  expect(response.status).toBe(200);
  expect(response.headers).toStrictEqual(
    new Headers({ 'Content-Type': 'application/json' }),
  );
});

test('createResponseFromError crates a correct error response', () => {
  const message = `Test message ${Math.random().toString()}`;
  const status = 401;
  const additionalHeaders = { 'Cache-Control': 'no-cache' };

  const response = createResponseFromError(
    new Error(message),
    status,
    additionalHeaders,
  );

  expect(response.json()).resolves.toStrictEqual({
    errorCode: 'Error',
    errorMessage: message,
  });
  expect(response.status).toBe(status);
  expect(response.headers).toStrictEqual(
    new Headers({
      'Content-Type': 'application/json',
      ...additionalHeaders,
    }),
  );
});
