export interface CloudWatchTransportOptions {
    logGroupName: string;
    logStreamName: string;
}

export interface SlackTransportOptions {
    webhookUrl: string;
    channel: string;
}

export interface LoggerOptions {
    cloudwatch?: {
        logGroupName: string;
        logStreamName: string;
    };
    slack?: {
        webhookUrl: string;
        channel: string;
    };
}