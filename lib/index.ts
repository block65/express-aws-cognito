import type { RequestHandler } from 'express';
import { expressAsyncWrap } from '@block65/express-async-wrapper';
import {
  AwsCognitoAuthOptions,
  awsCognitoTokenVerifierFactory,
} from '@block65/aws-cognito-auth';
import { AuthenticationError } from './authentication-error.js';

export { AuthenticationError };

export function expressAwsCognito({
  region,
  userPoolId,
  userIdGenerator,
}: AwsCognitoAuthOptions): RequestHandler {
  const verifier = awsCognitoTokenVerifierFactory({
    region,
    userPoolId,
    userIdGenerator,
  });

  return expressAsyncWrap(async (req, res, next): Promise<void> => {
    const headerValue = req.header('authorization')?.split(' ') || [];

    const [scheme = '', jwt = ''] = headerValue;

    if (!scheme) {
      throw new AuthenticationError(`Missing Authorization scheme`).debug({
        headerValue,
        scheme,
        jwt,
      });
    }

    if (scheme.toLowerCase() !== 'bearer') {
      throw new AuthenticationError(
        `Invalid Authorization scheme ${JSON.stringify(scheme)}`,
      ).debug({ headerValue, scheme, jwt });
    }

    if (!jwt) {
      throw new AuthenticationError('Invalid or missing bearer token').debug({
        headerValue,
        scheme,
        jwt,
      });
    }

    res.locals.token = await verifier(jwt);

    next();
  });
}
