import { Writable } from 'node:stream';
import winston from 'winston';
import { logFormats } from '../../src/utils/logger';

/**
 * Exercises the REAL logging pipeline (format + redaction + transport
 * write), not a silenced instance — this is the gap that let a real
 * bug (a custom winston format losing the `info` object's internal
 * Symbol-keyed properties, crashing `colorize()`) pass every other test
 * in this suite undetected, because the application's own `logger`
 * instance runs with `silent: true` under `NODE_ENV=test`, which skips
 * the format pipeline entirely rather than just muting output.
 */
function createCapturingLogger(format: winston.Logform.Format) {
  const chunks: string[] = [];
  const captureStream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });

  const testLogger = winston.createLogger({
    level: 'debug',
    format,
    transports: [new winston.transports.Stream({ stream: captureStream })],
    exitOnError: false,
  });

  return { testLogger, getOutput: () => chunks.join('') };
}

describe('logger pipeline (real, non-silent)', () => {
  it.each([
    ['development', logFormats.developmentFormat],
    ['production', logFormats.productionFormat],
  ])('%s format: does not throw when logging metadata (regression test)', (_name, format) => {
    const { testLogger } = createCapturingLogger(format);

    expect(() => {
      testLogger.info('server started', { port: 4000 });
      testLogger.warn('a warning', { requestId: 'abc-123', statusCode: 404 });
      testLogger.error('an error', { requestId: 'def-456', statusCode: 500 });
    }).not.toThrow();
  });

  it.each([
    ['development', logFormats.developmentFormat],
    ['production', logFormats.productionFormat],
  ])('%s format: redacts sensitive metadata in the actual written output', (_name, format) => {
    const { testLogger, getOutput } = createCapturingLogger(format);

    testLogger.warn('login attempt', {
      email: 'user@example.com',
      password: 'super-secret-value',
      authorization: 'Bearer abc.def.ghi',
    });

    const output = getOutput();
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('super-secret-value');
    expect(output).not.toContain('abc.def.ghi');
    expect(output).toContain('user@example.com'); // non-sensitive field preserved
  });
});
