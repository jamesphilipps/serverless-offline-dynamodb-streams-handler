import {StringKeyObject} from "./types";

// TODO: not sure how collection types work with filters. Not supported for now

type DynamoString = { S: string }
type DynamoNumber = { N: number }
type DynamoBinary = { B: string }
type DynamoBoolean = { BOOL: boolean }
type DynamoNull = { NULL: "" }

type DynamoList<T extends DynamoScalar> = { L: T }
type DynamoMap<T extends DynamoScalar> = { M: StringKeyObject<T> }

type DynamoStringSet = { SS: string[] }
type DynamoNumberSet = { NS: number[] }
type DynamoBinarySet = { BS: string[] }
type DynamoSet = DynamoStringSet | DynamoNumberSet | DynamoBinarySet

  export type DynamoScalar = DynamoString | DynamoNumber | DynamoBinary | DynamoBoolean | DynamoNull

export interface DynamoStreamsEventFilters {
    eventName?: string
    dynamodb?: {
        Keys?: StringKeyObject<DynamoScalar>
        NewImage?: StringKeyObject<DynamoScalar>
        OldImage?: StringKeyObject<DynamoScalar>
    }
}