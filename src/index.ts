import * as Serverless from "serverless"
import {LogOptions} from "serverless"
import {StringKeyObject} from "./types"

import StreamsController from "./StreamsController"
import {log, logDebug, setLog} from "./logging";
import {FunctionDefinition, getFunctionsWithStreamEvents} from "./support";
import {SLS_CUSTOM_OPTION, SLS_OFFLINE_OPTION} from "./constants";
import {default as Lambda} from 'serverless-offline/dist/lambda'

export default class ServerlessDynamoStreamsPlugin {
    commands: object = []
    hooks: StringKeyObject<Function>
    slsOfflineLambda?: typeof Lambda
    streamsController?: StreamsController
    options: StringKeyObject<any>

    constructor(private serverless: Serverless, private cliOptions: StringKeyObject<any>) {
        setLog((...args: [string, string, LogOptions]) => serverless.cli.log(...args))

        this.options = mergeOptions(serverless, cliOptions)
        logDebug('options:', this.options);

        this.hooks = {
            "offline:start:init": this.start.bind(this),
            "offline:start:end": this.end.bind(this),
        }
    }


    async start() {
        const {service} = this.serverless

        log(`Starting Offline Dynamodb Streams: ${this.options.stage}/${this.options.region}..`)
        this.slsOfflineLambda = new Lambda(this.serverless, this.options)
        this.streamsController = new StreamsController(this.serverless, this.slsOfflineLambda, this.options)

        const functions = this._getFunctionsWithRawFilterPatterns()
        const functionsWithStreamEvents = getFunctionsWithStreamEvents((functionKey: string) => functions[functionKey])(service.getAllFunctions())

        // Create lambdas
        this.slsOfflineLambda.create(functionsWithStreamEvents)
        await this.streamsController.start(functionsWithStreamEvents)
        log(`Started Offline Dynamodb Streams. Created ${this.streamsController.count()} streams`)
    }

    async end() {
        log("Halting Offline Dynamodb Streams")

        const cleanupPromises = []

        if (this.slsOfflineLambda) {
            cleanupPromises.push(this.slsOfflineLambda.cleanup())
        }

        if (this.streamsController) {
            cleanupPromises.push(this.streamsController.stop())
        }

        return Promise.all(cleanupPromises)
    }

    /**
     * For some reason, serverless messes about with event definitions in its functions property and removes the
     * dynamo typings from all event filters. This makes it impossible to properly match the filters. Luckily, the
     * raw configuration has the original structure, so we need to load in the ordinary functions and overwrite any
     * filter pattern fields with the original, unmodified version from the raw config.. why!?
     * @private
     */
    private _getFunctionsWithRawFilterPatterns() {
        const {service} = this.serverless
        const rawFunctionsConfig = (this.serverless as unknown as any).configurationInput.functions as StringKeyObject<any>

        return Object.fromEntries(service.getAllFunctions().map((functionName) => {
            const f = service.getFunction(functionName)
            const events = f.events.map((event, i) => {
                const eventStreamBlock = (event as unknown as any).stream;
                return ({
                    ...event,
                    stream: eventStreamBlock ? {
                        ...eventStreamBlock,
                        filterPatterns: rawFunctionsConfig[functionName]?.events[i]?.stream?.filterPatterns
                    } : undefined
                })
            })
            return [functionName, {...f, events} as FunctionDefinition] as [string, FunctionDefinition]
        }))
    }

}

const mergeOptions = (serverless: Serverless, cliOptions: StringKeyObject<any>) => {
    const {service: {custom = {}}} = serverless;
    const customOptions = custom[SLS_CUSTOM_OPTION];
    const offlineOptions = custom[SLS_OFFLINE_OPTION];

    const extraOptions = {
        region: serverless.service.provider.region
    }

    return {...offlineOptions, ...customOptions, ...extraOptions, ...cliOptions}
}

module.exports = ServerlessDynamoStreamsPlugin
