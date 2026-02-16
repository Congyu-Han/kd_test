export interface ErrorBody {
  code: string;
  message: string;
  requestId: string;
}

export class HttpExceptionFilter {
  format(error: unknown, requestId: string): ErrorBody {
    if (error instanceof Error) {
      return {
        code: 'internal_error',
        message: error.message,
        requestId
      };
    }

    return {
      code: 'unknown_error',
      message: 'unknown',
      requestId
    };
  }
}
