import type { RequestHandler } from 'express';
import { expressAsyncWrap } from '@block65/express-async-wrapper';
import {
  AwsCognitoAuthOptions,
  awsCognitoTokenVerifierFactory,
} from '@block65/aws-cognito-auth';
import { MissingAuthorizationError } from './missing-authorization-error';

export { MissingAuthorizationError };

export function expressAwsCognito({
  region,
  userPoolId,
  userIdGenerator,
}: AwsCognitoAuthOptions): RequestHandler {
  if (!region) {
    throw new Error('Missing/undefined issuer argument');
  }

  const verifier = awsCognitoTokenVerifierFactory({
    region,
    userPoolId,
    userIdGenerator,
  });

  return expressAsyncWrap(
    async (req, res, next): Promise<void> => {
      const [scheme = '', jwt = ''] =
        req.header('authorization')?.split(' ') || [];

      if (scheme.toLowerCase() !== 'bearer') {
        throw new MissingAuthorizationError(
          `Expected Authorization method: Bearer - saw ${scheme}`,
        ).debug({ scheme, jwt });
      }

      if (!jwt) {
        throw new MissingAuthorizationError(
          'Invalid or Missing Bearer token',
        ).debug({
          scheme,
          jwt,
        });
      }

      res.locals.token = await verifier(jwt);

      next();
    },
  );
}
