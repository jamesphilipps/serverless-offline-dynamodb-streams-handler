import {FilterPatterns, NumericOperator, NumericRange, NumericSingle} from "./filterGrammar";
import {DynamoStreamsEventFilters} from "../dynamoStreamsEventTypes";

const AWSDataKeys = new Set(["S", "N", "B", "BOOL", "L", "M", "NS", "SS", "BS", "NULL"])
const AWSRuleKeys = new Set(["anything-but"])

const isDataContainer = (v: any): boolean => !!(v && typeof v === 'object' && Object.keys(v).length === 1)
const dataContainerKey = (v: object) => Object.keys(v)[0]
const dataContainerValue = (v: object) => v[dataContainerKey(v)]


const isPrimitiveScalar = (v: any): boolean => new Set(['boolean', 'string', 'number']).has(typeof v)
const isArrayScalar = (v: any): boolean => Array.isArray(v)
const isAwsScalar = (v: any): boolean => isDataContainer(v) && AWSDataKeys.has((Object.keys(v))[0])
const isEmptyScalar = (v: any): boolean => v === undefined || v === null
const isScalar = (v: any): boolean => isPrimitiveScalar(v) || isArrayScalar(v) || isAwsScalar(v) || isEmptyScalar(v)

const isAwsRule = (v: any, ruleKey?: string): boolean => {
    if (!isDataContainer(v)) return false
    return ruleKey ? ruleKey === dataContainerKey(v) : AWSRuleKeys.has(dataContainerKey(v))
}


const toScalar = (data: any): Array<any> => {
    if (Array.isArray(data)) {
        return data as Array<any>
    }
    if (isAwsScalar(data)) {
        const dataTypeKey = Object.keys(data)[0];
        if (dataTypeKey === 'NULL') {
            return null
        }
        return toScalar(data[dataTypeKey])
    }
    return data
}

const isAnythingButMatch = (p: any, data: any) =>
    isAwsRule(p, 'anything-but') && evalReduceAnd(dataContainerValue(p), (v) => v !== data)

const isExistsMatch = (p: any, data: any) =>
    isAwsRule(p, 'exists') && (!!(p.exists && data) || !!(!p.exists && !data))

const isNumericMatch = (p: any, data: any) => {
    const applyMatchRules = (operator: NumericOperator, operand: number) => {
        switch (operator) {
            case '=':
                return data === operand
            case '<':
                return data < operand
            case '<=':
                return data <= operand
            case '>':
                return data > operand
            case '>=':
                return data >= operand
            default:
                throw Error(`Unknown numeric rule operand: '${operand}'`)
        }
    }

    if (isAwsRule(p, 'numeric')) {
        const numericRules = dataContainerValue(p);
        if (numericRules.length === 2) {
            const [operator, operand] = numericRules as NumericSingle
            return applyMatchRules(operator, operand)
        } else {
            const [operator1, operand1, operator2, operand2] = numericRules as NumericRange
            return applyMatchRules(operator1, operand1) && applyMatchRules(operator2, operand2)
        }
    }
    return false
}

const isEqualityMatch = (p: any, data: any) =>
    p === null && data === null ||
    (isPrimitiveScalar(p) && isPrimitiveScalar(data) && p === data) ||
    (isArrayScalar(p) && isPrimitiveScalar(data) && evalReduceOr(p, (v) => v === data))

const isBeginsWithMatch = (p: any, data: any) =>
    isAwsRule(p, 'prefix') && data.startsWith(dataContainerValue(p))

const isMatch = (p: any, data: any) => evalReduceOr([
    isEqualityMatch,
    isAnythingButMatch,
    isNumericMatch,
    isExistsMatch,
    isBeginsWithMatch
], f => f.apply(null, [p, data]))

const evalNested = (patternData: any, eventData: any) => {
    if (isScalar(patternData) && isScalar(eventData)) {
        const patternDataScalar = toScalar(patternData);
        const eventDataScalar = toScalar(eventData)
        return evalReduceOr(patternDataScalar, (p) => isMatch(p, eventDataScalar))
    } else {
        return evalReduceAnd(Object.keys(patternData), (k) => evalNested(patternData?.[k], eventData?.[k]))
    }
}

function evalReduceAnd<T>(data: T[], evalFunc: (data: T, i: number) => boolean): boolean {
    return evalReduce(data, evalFunc, (acc, v) => acc && v)
}

function evalReduceOr<T>(data: T[], evalFunc: (data: T, i: number) => boolean): boolean {
    return evalReduce(data, evalFunc, (acc, v) => acc || v)
}

function evalReduce<T>(data: T[], evalFunc: (data: T, i: number) => boolean, reduceFunc: (acc: boolean, v: boolean) => boolean): boolean {
    return data.map((d, i) => evalFunc(d, i)).reduce(reduceFunc)
}

export const allowEvent = (filterPatterns: FilterPatterns[], event: DynamoStreamsEventFilters): boolean => evalReduceOr(filterPatterns, (p) => evalNested(p, event))