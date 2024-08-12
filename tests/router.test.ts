import type { Router, ExtendedRequest } from '../src/router';

import { expect, test, describe, vi } from 'vitest';

import { createRouter } from '../src/router';

function routerTest<
  R extends ExtendedRequest = ExtendedRequest,
  AdditionalArguments extends unknown[] = [],
>(base?: string) {
  return test.extend<{
    context: { router: Router<R, AdditionalArguments> };
  }>({
    context: async ({} /* eslint-disable-line no-empty-pattern */, use) => {
      await use({
        router: createRouter(base),
      });
    },
  });
}

const BASE = 'https://base.com';
const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
  'TRACE',
];

describe.each([
  ['/test', `/test-${Math.random().toString()}`, '/test'],
  [
    `/test/${Math.random().toString()}`,
    `/test-${Math.random().toString()}/:id`,
    '/test/:id',
  ],
  [
    `/test/${Math.random().toString()}`,
    `/test-${Math.random().toString()}/*`,
    '/test/*',
  ],
  ['/test123', '/test', '/test{123}?'],
  ['/test/123', `/test/${Math.random().toString()}`, '/test/(\\d+)'],
])('router should', (path, controlPattern, experimentalPattern) => {
  routerTest(BASE)(
    `match "${BASE}${path}" for pattern "${experimentalPattern}"`,
    ({ context }) => {
      const { router } = context;
      const handler = vi.fn(() => 'test');

      router.get(experimentalPattern, handler);
      router.get(controlPattern, handler);

      router.fetch(new Request(`${BASE}${path}`));

      expect(handler).toBeCalledTimes(1);
    },
  );

  routerTest(BASE)(
    `match "${BASE}${path}" for pattern "${BASE}${experimentalPattern}"`,
    ({ context }) => {
      const { router } = context;
      const handler = vi.fn(() => 'test');

      router.get(`${BASE}${experimentalPattern}`, handler);
      router.get(`${BASE}${controlPattern}`, handler);

      router.fetch(new Request(`${BASE}${path}`));

      expect(handler).toBeCalledTimes(1);
    },
  );
});

describe.each(HTTP_METHODS)(
  'router should match any method for route method "all"',
  (method) => {
    routerTest(BASE)(method, ({ context }) => {
      const { router } = context;
      const path = '/test';
      const handler = vi.fn(() => 'test');

      router.all(path, handler);

      router.fetch(new Request(`${BASE}${path}`, { method }));

      expect(handler).toBeCalledTimes(1);
    });
  },
);

routerTest<ExtendedRequest & { foo?: number; bar?: number }>(BASE)(
  'request should be extendable in handlers',
  ({ context }) => {
    const { router } = context;
    const path = '/test';

    const fooValue = Math.random();
    const barValue = fooValue + 1;

    router.get(
      path,
      (request) => {
        request.foo = fooValue;
      },
      (request) => {
        request.bar = barValue;
      },
      ({ foo, bar }) => {
        expect(foo).toBe(fooValue);
        expect(bar).toBe(barValue);
      },
    );

    router.fetch(new Request(`${BASE}${path}`));
  },
);

routerTest<ExtendedRequest & { foo?: number }>(BASE)(
  'handlers should be called in sequence',
  ({ context }) => {
    const { router } = context;
    const path = '/test';

    const initialValue = Math.random();
    const finalValue = initialValue + 1;

    router.get(
      path,
      (request) => {
        request.foo = initialValue;
      },
      (request) => {
        request.foo = finalValue;
      },
      ({ foo }) => {
        expect(foo).toBe(finalValue);
      },
    );

    router.fetch(new Request(`${BASE}${path}`));
  },
);

routerTest(BASE)('parsedURL should be available in handler', ({ context }) => {
  const { router } = context;
  const path = '/test';

  router.get(path, ({ parsedURL }) => {
    expect(parsedURL).toBeDefined();
  });

  router.fetch(new Request(`${BASE}${path}`));
});

routerTest<ExtendedRequest, [number]>(BASE)(
  'additional arugments should be available in handler',
  ({ context }) => {
    const { router } = context;
    const path = '/test';
    const fooValue = Math.random();

    router.get(path, (_, foo) => {
      expect(foo).toBe(fooValue);
    });

    router.fetch(new Request(`${BASE}${path}`), fooValue);
  },
);

routerTest(BASE)(
  'router.fetch should resolve to the return value of the handler',
  ({ context }) => {
    const { router } = context;
    const path = '/test';
    const returnValue = Math.random();
    const handler = vi.fn(() => returnValue);

    router.get(path, handler);

    expect(router.fetch(new Request(`${BASE}${path}`))).resolves.toBe(
      returnValue,
    );
  },
);

routerTest(BASE)(
  'router.fetch should resolve to the return value of the first handler returning a truthy value',
  ({ context }) => {
    const { router } = context;
    const path = '/test';

    const firstReturnValue = Math.random();
    const secondReturnValue = firstReturnValue + 1;

    const firstHandler = vi.fn(() => firstReturnValue);
    const secondHandler = vi.fn(() => secondReturnValue);

    router.get(path, firstHandler, secondHandler);

    expect(router.fetch(new Request(`${BASE}${path}`))).resolves.toBe(
      firstReturnValue,
    );
    expect(secondHandler).toBeCalledTimes(0);
  },
);
