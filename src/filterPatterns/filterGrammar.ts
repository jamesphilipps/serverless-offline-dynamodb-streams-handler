import {StringKeyObject} from "../types";

// Dynamo scalars are expressed as arrays to allow OR logic
type DynamoString = { S: string[] }
type DynamoNumber = { N: number[] }
type DynamoBinary = { B: string[] }
type DynamoBoolean = { BOOL: boolean[] }
type DynamoNull = { NULL: "" }
type DynamoScalar = DynamoString | DynamoNumber | DynamoBinary | DynamoBoolean | DynamoNull


export type NumericOperator = '=' | '<' | '<=' | '>' | '>='
export type NumericSingle = [NumericOperator, number]
export type NumericRange = [NumericOperator, number, NumericOperator, number]

export type NullRule = null
export type EmptyRule = ""
export type NotRule = { 'anything-but': string[] | number[] }
export type NumericRule = { numeric: NumericSingle | NumericRange }
export type ExistsRule = { exists: boolean }
export type BeginsWithRule = { prefix: string }

type FilterRule =
    NullRule |
    EmptyRule |
    NotRule |
    NumericRule |
    ExistsRule |
    BeginsWithRule

export type Filter =
    DynamoScalar |  // Direct equality. Or is expressed as an OR array inside the type eg. { S : ["FOO", "BAR"] }
    FilterRule[]    // Filter rules always expressed as an OR array, even when only one rule present

export interface FilterPatterns {
    eventName?: string[]
    dynamodb?: {
        Keys?: StringKeyObject<Filter>
        NewImage?: StringKeyObject<Filter>
        OldImage?: StringKeyObject<Filter>
    }
}