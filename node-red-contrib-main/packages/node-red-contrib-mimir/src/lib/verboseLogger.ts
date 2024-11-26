const VLOGGER_PREFIX = '[VLOG]';

export function createVerboseLogger(enabled: boolean) {
  return (...args: unknown[]): void => {
    if (enabled) {
      console.log.apply(console, [`[${new Date().toISOString()}]`, VLOGGER_PREFIX, ...args]);
    }
  };
}

export function createVerbosePromiseLogger(enabled: boolean) {
  return (...args: unknown[]) => {
    return (result: unknown): unknown => {
      if (enabled) {
        console.log.apply(console, [`[${new Date().toISOString()}]`, VLOGGER_PREFIX, ...args]);
      }
      return result;
    };
  };
}
