import { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand, DescribeLogStreamsCommand } from "@aws-sdk/client-cloudwatch-logs";
import axios from "axios";
import type { CloudWatchTransportOptions, SlackTransportOptions } from "./@types/index.d.ts";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const cloudwatchClient = new CloudWatchLogsClient({ region: AWS_REGION });

export class CloudWatchTransport {
    private logGroupName: string;
    private logStreamName: string;
    private sequenceToken: string | undefined;

    constructor(options: CloudWatchTransportOptions) {
        this.logGroupName = options.logGroupName;
        this.logStreamName = options.logStreamName;
    }

    async ensureLogGroupExists() {
        try {
            await cloudwatchClient.send(new CreateLogGroupCommand({ logGroupName: this.logGroupName }));
        } catch (error) {
            if ((error as Error).name !== "ResourceAlreadyExistsException") {
                console.error("Error creating log group:", error);
                throw error;
            }
        }
    }

    async ensureLogStreamExists() {
        try {
            await cloudwatchClient.send(
                new CreateLogStreamCommand({
                    logGroupName: this.logGroupName,
                    logStreamName: this.logStreamName,
                })
            );
        } catch (error) {
            if ((error as Error).name !== "ResourceAlreadyExistsException") {
                console.error("Error creating log stream:", error);
                throw error;
            }
        }
    }

    async getSequenceToken() {
        const response = await cloudwatchClient.send(
            new DescribeLogStreamsCommand({
                logGroupName: this.logGroupName,
                logStreamNamePrefix: this.logStreamName,
            })
        );

        const logStream = response.logStreams?.find((stream) => stream.logStreamName === this.logStreamName);
        return logStream?.uploadSequenceToken;
    }

    async log(info: any) {
        try {
            // Ensure log group and stream exist
            await this.ensureLogGroupExists();
            await this.ensureLogStreamExists();

            // Get the sequence token
            this.sequenceToken = await this.getSequenceToken();

            // Prepare log event
            const logEvent = {
                timestamp: new Date().getTime(),
                message: JSON.stringify(info),
            };

            // Send log to CloudWatch
            await cloudwatchClient.send(
                new PutLogEventsCommand({
                    logGroupName: this.logGroupName,
                    logStreamName: this.logStreamName,
                    logEvents: [logEvent],
                    sequenceToken: this.sequenceToken,
                })
            );
        } catch (error) {
            console.error("Error sending log to CloudWatch:", error);
        }
    }
}

export class SlackTransport {
    private webhookUrl: string;
    private channel: string;

    constructor(options: SlackTransportOptions) {
        this.webhookUrl = options.webhookUrl;
        this.channel = options.channel;
    }

    async log(info: any) {
        try {
            // Send the message to Slack using the webhook
            await axios.post(this.webhookUrl, {
                text: `\`\`\`[${info.level}] ${JSON.stringify({ ...info, level: undefined }, null, 2)}\`\`\``,
                channel: this.channel,
            });
        } catch (error) {
            console.error("Error sending log to Slack:", error);
        }
    }
}