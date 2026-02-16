import { describe, expect, it } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  it('returns unified error shape with requestId', () => {
    const filter = new HttpExceptionFilter();
    const body = filter.format(new Error('boom'), 'req-1');

    expect(body).toEqual(
      expect.objectContaining({
        code: expect.any(String),
        requestId: 'req-1'
      })
    );
  });
});
