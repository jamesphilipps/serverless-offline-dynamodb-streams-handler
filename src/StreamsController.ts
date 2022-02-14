import {Writable} from "stream"
import * as  DynamodbStreamsReadable from "dynamodb-streams-readable"
import {log, logDebug} from "./logging";
import * as Serverless from "serverless";
import {SLS_CUSTOM_OPTION} from "./constants";
import {FunctionWithStreamEvents} from "./support";
import {allowEvent} from "./filterPatterns/filterPatterns";

import {DescribeTableCommand, DynamoDBClient, waitUntilTableExists} from '@aws-sdk/client-dynamodb'
import {DynamoDbStreamsEventDefinition, StringKeyObject} from "./types";

import * as DynamodbStreamsClient from "aws-sdk/clients/dynamodbstreams"
import {FilterPatterns} from "./filterPatterns/filterGrammar";

export default class StreamsController {
    private readonly dynamodbClient: DynamoDBClient
    private readonly dynamodbStreamsClient: DynamodbStreamsClient
    private readableStreams: typeof DynamodbStreamsReadable[] = []

    constructor(private serverless: Serverless, private lambda: any, private options: { [key: string]: any }) {
        this.serverless = serverless
        this.dynamodbClient = new DynamoDBClient(this.options)
        this.dynamodbStreamsClient = new DynamodbStreamsClient(this.options)
    }

    start(functionEvents: FunctionWithStreamEvents[]) {
        return Promise.all(
            functionEvents.flatMap((functionEvent) => {
                const {functionKey, events} = functionEvent
                return events
                    .filter((event) => event.stream.enabled !== false)
                    .map(async (event) => {
                        logDebug("Creating stream for event", event)
                        const tableName = this._extractTableNameFromARN(event.stream.arn)
                        const {Table: {LatestStreamArn}} = await this._describeTable(tableName)
                        const streamDesc = await this.dynamodbStreamsClient.describeStream({StreamArn: LatestStreamArn}).promise()

                        const shards = streamDesc.StreamDescription.Shards
                        const shardStreams = shards
                            .map((shard) => this._createStream(functionKey, LatestStreamArn, shard.ShardId, event))
                        this.readableStreams.push(shardStreams)
                    })
            })
        )
    }

    async stop() {
        this.readableStreams.forEach((r) => r.close())
    }

    count(): number {
        return this.readableStreams.length
    }

    private async _describeTable(TableName: string) {
        await waitUntilTableExists({
            client: this.dynamodbClient,
            maxWaitTime: 10,
            minDelay: 1
        }, {TableName})
        return this.dynamodbClient.send(new DescribeTableCommand({TableName}))
    }

    private _extractTableNameFromARN(arn: any) {
        if (typeof arn === 'string') {
            if (arn.startsWith("arn:")) {
                // AWS Arn. Parse the table name from the string
                const [, , , , , TableURI] = arn.split(":")
                const [, TableName] = TableURI.split("/")
                return TableName
            } else {
                // Probably an output reference. Use directly as a key to the custom resources table
                const tableName = this.options?.tableNames?.[arn]
                if (!tableName)
                    throw Error(`No table name mapping entry for stream arn: '${arn}'. Add a mapping at 'custom.${SLS_CUSTOM_OPTION}.tableNames.${arn}'`)
                return tableName
            }
        } else if (Array.isArray(arn) && arn.length === 2 && arn[1] === 'StreamArn') {
            // An attribute reference to a resource defined within the stack. Check the defined resources
            const resources = this.serverless.service.resources.Resources
            const resourceKey = arn[0]
            const tableName = resources[resourceKey]?.Properties?.TableName
            if (!tableName) throw Error(`Could not find table name at '${resourceKey}.Properties.TableName'`)
            return tableName
        }
        throw Error(`Cannot resolve arn: ${arn} to a table name`)
    }

    private _createStream(functionKey: string, LatestStreamArn: string, shardId: string, event: DynamoDbStreamsEventDefinition): DynamodbStreamsReadable {
        const {region} = this.options
        const {batchSize, arn} = event.stream


        const applyEventFilters = (filterPatterns: FilterPatterns[], event: any): boolean => {
            logDebug("filterPatterns", filterPatterns)
            logDebug("event", event)

            if (!filterPatterns || filterPatterns.length == 0 || allowEvent(filterPatterns, event)) {
                return true
            } else {
                log("Filtered DynamoDb streams event")
                return false
            }
        }

        const enrichRecord = (record: StringKeyObject<any>) => ({
            ...record,
            awsRegion: region,
            eventSourceArn: arn
        })

        const readable = DynamodbStreamsReadable(this.dynamodbStreamsClient, LatestStreamArn, {
            shardId,
            limit: batchSize,
            iterator: 'LATEST'
        })

        const writable = new Writable({
            objectMode: true,
            write: (records: any[], _: any, cb: (error?: Error | null) => void) => {
                log(`Received ${records.length} DynamoDb streams events`)
                logDebug(event)
                const {filterPatterns} = event.stream
                const filteredRecords = records
                    .filter((r) => applyEventFilters(filterPatterns, r))
                    .map((r) => enrichRecord(r))

                if (filteredRecords.length > 0) {
                    const lambdaFunction = this.lambda.get(functionKey)
                    lambdaFunction.setEvent({Records: filteredRecords})

                    // Run handler and return on completion
                    lambdaFunction.runHandler()
                        .then(() => cb())
                        .catch(cb)
                } else {
                    // Return immediately
                    cb()
                }
            },
        })

        readable.pipe(writable)
        return readable
    }
}

