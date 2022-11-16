import pino from 'pino'

export const logger = pino({
  level: 'trace',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: `SYS:mm-dd HH:MM:ss.l`,
      ignore: 'pid,hostname',
    },
  },
})
