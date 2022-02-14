import {FilterPatterns} from "./filterPatterns/filterGrammar";

export type StringKeyObject<T> = { [key: string]: T }

export interface DynamoDbStreamsEventDefinition {
    stream: {
        type: "dynamodb"
        arn: string
        enabled?: boolean
        batchSize?:number
        startingPosition?: 'LATEST' | 'TRIM_HORIZON'
        filterPatterns: FilterPatterns[]
    }
}
