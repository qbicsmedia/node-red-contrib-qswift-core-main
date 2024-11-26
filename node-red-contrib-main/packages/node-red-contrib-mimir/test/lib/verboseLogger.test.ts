import { createVerboseLogger, createVerbosePromiseLogger } from '../../src/lib/verboseLogger';

describe('verbose logger', () => {
  const TEST_LOG_TEXT = 'THIS IS A TEST LOG';

  describe('logger', () => {
    it('should log if enabled', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const vLog = createVerboseLogger(true);

      expect(logSpy).not.toHaveBeenCalled();
      vLog(TEST_LOG_TEXT);
      expect(logSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.any(String), '[VLOG]', TEST_LOG_TEXT);
    });

    it('should not log if not enabled', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const vLog = createVerboseLogger(false);

      expect(logSpy).not.toHaveBeenCalled();
      vLog(TEST_LOG_TEXT);
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('promise logger', () => {
    it('should log if enabled', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const vpLog = createVerbosePromiseLogger(true);
      const data = { test: true };

      expect(logSpy).not.toHaveBeenCalled();
      const result = await Promise.resolve(data).then(vpLog(TEST_LOG_TEXT));
      expect(logSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.any(String), '[VLOG]', TEST_LOG_TEXT);
      expect(result).toEqual(data);
    });

    it('should not log if not enabled', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const vpLog = createVerbosePromiseLogger(false);
      const data = { test: true };

      expect(logSpy).not.toHaveBeenCalled();
      const result = await Promise.resolve(data).then(vpLog(TEST_LOG_TEXT));
      expect(logSpy).not.toHaveBeenCalled();
      expect(result).toEqual(data);
    });
  });
});
