const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, errors, json, colorize, align } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack, requestId, ...rest }) => {
  const meta = Object.keys(rest).length ? JSON.stringify(rest) : '';
  const requestIdStr = requestId ? ` [req:${requestId}]` : '';
  if (stack) {
    return `${ts} ${level}: ${message}${requestIdStr}\n${stack}${meta ? ' ' + meta : ''}`;
  }
  return `${ts} ${level}: ${message}${requestIdStr}${meta ? ' ' + meta : ''}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    align(),
    process.env.NODE_ENV === 'development' ? colorize() : json(),
    logFormat
  ),
  defaultMeta: { service: 'order-processing-system' },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'development'
          ? combine(colorize(), timestamp(), logFormat)
          : json(),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/rejections.log'),
    }),
  ],
});

module.exports = logger;
