import type { RequestHandler } from 'express';
import { expressAsyncWrap } from '@block65/express-async-wrapper';
import {
  AwsCognitoAuthOptions,
  awsCognitoTokenVerifierFactory,
} from '@block65/aws-cognito-auth';
import { InvalidAuthenticationError } from './invalid-authentication-error.js';

export { InvalidAuthenticationError };

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
      throw new InvalidAuthenticationError()
        .addDetail({
          violations: [
            {
              field: 'authorization',
              description: 'Missing scheme',
            },
          ],
        })
        .debug({
          headerValue,
          scheme,
          jwt,
        });
    }

    if (scheme.toLowerCase() !== 'bearer') {
      throw new InvalidAuthenticationError()
        .addDetail({
          violations: [
            {
              field: 'authorization',
              description: 'Invalid scheme',
            },
          ],
        })
        .debug({ headerValue, scheme });
    }

    if (!jwt) {
      throw new InvalidAuthenticationError()
        .addDetail({
          violations: [
            {
              field: 'authorization',
              description: 'Missing bearer token',
            },
          ],
        })
        .debug({
          headerValue,
          jwt,
        });
    }

    res.locals.token = await verifier(jwt);

    next();
  });
}
