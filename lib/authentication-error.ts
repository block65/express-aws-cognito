import { CustomError, Status } from '@block65/custom-error';

export class AuthenticationError extends CustomError {
  public constructor(message: string, err?: Error) {
    super(message, err);
    this.setName('AuthenticationError');
    this.code = Status.PERMISSION_DENIED;
  }
}
