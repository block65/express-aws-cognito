import { CustomError, Status } from '@block65/custom-error';

export class InvalidAuthenticationError extends CustomError {
  public code = Status.INVALID_ARGUMENT;

  constructor(message?: string, cause?: Error) {
    super(message || 'Invalid Authentication', cause);
  }
}
