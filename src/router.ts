export type ExtendedRequest = Request & {
  parsedURL?: URLPatternURLPatternResult;
};

export type Handler<
  R extends ExtendedRequest,
  AdditionalArguments extends unknown[],
> = (request: R, ...additionalArguments: AdditionalArguments) => unknown;
export type Route<
  R extends ExtendedRequest,
  AdditionalArguments extends unknown[],
> = [URLPattern, string, Handler<R, AdditionalArguments>[]];

export type Method =
  | 'all'
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'head'
  | 'options'
  | 'trace';

// This type is not exported as it is not useful for the consumer
type RouterBase<
  R extends ExtendedRequest,
  AdditionalArguments extends unknown[],
  CustomMethod extends string,
> = {
  r: Route<R, AdditionalArguments>[];
} & {
  [K in Method | CustomMethod]: (
    pattern: string,
    ...handlers: Handler<R, AdditionalArguments>[]
  ) => Router<R, AdditionalArguments, CustomMethod>;
};

export type Router<
  R extends ExtendedRequest = ExtendedRequest,
  AdditionalArguments extends unknown[] = [],
  CustomMethod extends string = never,
> = RouterBase<R, AdditionalArguments, CustomMethod> & {
  /**
   * Handles an incoming fetch event
   * @param request An incoming request. Can be extended by middlewares
   * @param additionalArguments Additional arguments to be passed to the registered handlers (e.g. environment bindings)
   * @returns The return value of the first handler returning a truthy value
   */
  fetch: (
    request: R,
    ...additionalArguments: AdditionalArguments
  ) => Promise<unknown>;
};

/**
 * Creates an itty-router like tiny router
 * @param base Base URL of the router. If omitted, all patterns must be a full URL
 * @returns The created router
 *
 * The code is derived from https://github.com/kwhitley/itty-router/blob/v5.x/src/IttyRouter.ts. LICENSE: MIT
 */
export const createRouter = <
  R extends ExtendedRequest = ExtendedRequest,
  AdditionalArguments extends unknown[] = [],
  CustomMethod extends string = never,
>(
  base?: string,
) => {
  const router = Object.create(
    new Proxy<{
      r: Route<R, AdditionalArguments>[];
    }>(
      // Declared routes, use a shorter name to keep the size small
      { r: [] },
      {
        get: (
          target,
          property: string,
          receiver: RouterBase<R, AdditionalArguments, CustomMethod>,
        ) =>
          property === 'r'
            ? target.r
            : (
                pattern: string,
                ...handlers: Handler<R, AdditionalArguments>[]
              ) =>
                target.r.push([
                  new URLPattern(pattern, base),
                  property,
                  handlers,
                ]) && receiver,
      },
    ),
  ) as Router<R, AdditionalArguments, CustomMethod>;

  // Use a function statement here, as arrow functions does not have access to 'this'
  router.fetch = async function (
    request,
    ...additionalArguments
  ): Promise<unknown> {
    const { url, method } = request;

    for (const [pattern, routeMethod, handlers] of this.r) {
      const match = pattern.exec(url);
      if (
        (method.toLowerCase() === routeMethod || routeMethod === 'all') &&
        match
      ) {
        request.parsedURL = match;

        let response: unknown;
        for (const handler of handlers) {
          if ((response = await handler(request, ...additionalArguments))) {
            return response;
          }
        }
      }
    }
  };

  return router;
};
