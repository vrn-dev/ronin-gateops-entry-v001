const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

const logger = createLogger({
    level: 'info',
    format: combine(
        label({ label: 'entry-gate' }),
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.File({ filename: 'error.log', level: 'error', maxsize: '10000000' }),
        new transports.File({ filename: 'combined.log', maxsize: '10000000' })
    ]
});

logger.log({
    level: 'info',
    message: 'logger.log'
});

logger.info('logger.info');

logger.log({
    level: 'error',
    message: 'error.log'
});

logger.error('logger.error');