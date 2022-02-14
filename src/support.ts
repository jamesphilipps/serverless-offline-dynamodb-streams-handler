import {DynamoDbStreamsEventDefinition, StringKeyObject} from "./types";
import {log} from "./logging";
import {FilterPatterns} from "./filterPatterns/filterGrammar";

export type Event = DynamoDbStreamsEventDefinition | any

export interface FunctionDefinition {
    name?: string
    handler?: string
    role?: string
    events?: Event[]
}

export interface FunctionWithStreamEvents {
    functionKey: string
    functionDefinition: FunctionDefinition
    events: DynamoDbStreamsEventDefinition[]
}

export const getFunctionsWithStreamEvents = (
    getFunction: (functionKey: string) => FunctionDefinition
) => (functions: string[]): FunctionWithStreamEvents[] => functions
    .map((functionKey) => {
        const functionDefinition = getFunction(functionKey)
        console.log("FUNCDEF", JSON.stringify(functionDefinition))
        return {functionKey, functionDefinition, events: getStreamEvents(functionDefinition)}
    })
    .filter(({events}) => events.length > 0)

const getStreamEvents = (functionDef: FunctionDefinition): DynamoDbStreamsEventDefinition[] => functionDef.events
    .filter(event => event?.stream?.type === 'dynamodb')
    .map(event => event as DynamoDbStreamsEventDefinition)

export const getTableName = (resources: StringKeyObject<any>) => (resourceKey: string) => {
    log(JSON.stringify(resources))
    const tableName = resources[resourceKey]?.Properties?.TableName
    if (!tableName) throw Error(`Could not find table name at '${resourceKey}.Properties.TableName'`)
    return tableName
}