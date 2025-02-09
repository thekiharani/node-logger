import winston from 'winston';
import type { LoggerOptions } from './@types/index.d.ts';
import { CloudWatchTransport, SlackTransport } from './logger.js';

export const createLogger = (options: LoggerOptions) => {
    const transports: winston.transport[] = [];

    if (options.cloudwatch) {
        const cloudwatchTransport = new CloudWatchTransport(options.cloudwatch);
        transports.push(
            new winston.transports.Console({
                log(info, callback) {
                    cloudwatchTransport.log(info);
                    callback();
                },
            })
        );
    }

    if (options.slack) {
        const slackTransport = new SlackTransport(options.slack);
        transports.push(
            new winston.transports.Console({
                log(info, callback) {
                    slackTransport.log(info);
                    callback();
                },
            })
        );
    }

    return winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports,
    });
};