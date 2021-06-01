import type { RequestHandler } from 'express';
import { expressAsyncWrap } from '@block65/express-async-wrapper';
import {
  AwsCognitoAuthOptions,
  awsCognitoTokenVerifierFactory,
} from '@block65/aws-cognito-auth';
import { MissingAuthorizationError } from './missing-authorization-error.js';

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

  return expressAsyncWrap(async (req, res, next): Promise<void> => {
    const headerValue = req.header('authorization')?.split(' ') || [];

    const [scheme = '', jwt = ''] = headerValue;

    if (!scheme) {
      throw new MissingAuthorizationError(`Missing Authorization scheme`).debug(
        { headerValue, scheme, jwt },
      );
    }

    if (scheme.toLowerCase() !== 'bearer') {
      throw new MissingAuthorizationError(
        `Invalid Authorization scheme ${JSON.stringify(scheme)}`,
      ).debug({ headerValue, scheme, jwt });
    }

    if (!jwt) {
      throw new MissingAuthorizationError(
        'Invalid or missing bearer token',
      ).debug({
        headerValue,
        scheme,
        jwt,
      });
    }

    res.locals.token = await verifier(jwt);

    next();
  });
}
