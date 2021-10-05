import { CustomError } from '@block65/custom-error';
import { describe, jest, test } from '@jest/globals';
import type { Request, Response } from 'express';
import express from 'express';
import { expressAwsCognito } from '../lib/index.js';
import { InvalidAuthenticationError } from '../lib/invalid-authentication-error.js';

function createFakeRequest(
  options: { headers?: Record<string, string> } = {},
): Request {
  return {
    body: {},
    cookies: {},
    query: {},
    params: {},
    headers: options.headers || {},
    method: 'get',
    url: '/',
    listeners: () => [],
    get: jest.fn(),
    resume: jest.fn().mockReturnThis(),
    ...options,
  } as unknown as Request;
}

function createFakeResponse(): Response {
  return {
    setHeader: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function testApp(req: Request, res: Response): Promise<unknown> {
  const app = express();
  app.use(expressAwsCognito({ region: 'local', userPoolId: 'issuer' }));

  return new Promise<void>((resolve, reject) => {
    app(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function returnError(err: any): any {
  return err;
}

describe('express', () => {
  test('should throw correct error with missing header', async () => {
    await expect(
      testApp(createFakeRequest(), createFakeResponse()),
    ).rejects.toBeInstanceOf(InvalidAuthenticationError);
  });

  test('should throw correct error with invalid headers', async () => {
    const err = await testApp(
      createFakeRequest({
        headers: {
          authorization: 'Boring JWT',
        },
      }),
      createFakeResponse(),
    ).catch(returnError);

    await expect((err as CustomError).toJSON()).toMatchSnapshot({
      stack: expect.any(String),
    });
  });

  test('should throw correct error with missing JWT ', async () => {
    const err = await testApp(
      createFakeRequest({
        headers: {
          authorization: 'Bearer',
        },
      }),
      createFakeResponse(),
    ).catch(returnError);

    await expect((err as CustomError).toJSON()).toMatchSnapshot({
      stack: expect.any(String),
    });
  });

  test('should throw TokenError with bad JWT ', async () => {
    const err = await testApp(
      createFakeRequest({
        headers: {
          authorization: 'Bearer DED',
        },
      }),
      createFakeResponse(),
    ).catch(returnError);

    await expect((err as CustomError).toJSON()).toMatchSnapshot({
      stack: expect.any(String),
    });
  });

  test('should throw TokenError with fake JWT ', async () => {
    const err = await testApp(
      createFakeRequest({
        headers: {
          authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      }),
      createFakeResponse(),
    ).catch(returnError);

    await expect((err as CustomError).toJSON()).toMatchSnapshot({
      stack: expect.any(String),
    });
  });
});
