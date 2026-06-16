const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
};

export const logger = {
  info: (msg) => console.log(formatMessage('info', msg)),
  warn: (msg) => console.warn(formatMessage('warn', msg)),
  error: (msg) => console.error(formatMessage('error', msg)),
  debug: (msg) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatMessage('debug', msg));
    }
  },
  http: (msg) => console.log(formatMessage('http', msg))
};
