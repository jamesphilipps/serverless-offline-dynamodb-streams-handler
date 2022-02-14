import {allowEvent} from "./filterPatterns";
import {FilterPatterns, NumericRange, NumericSingle} from "./filterGrammar";
import {DynamoScalar, DynamoStreamsEventFilters} from "../dynamoStreamsEventTypes";

describe("allowEvent", () => {
    it( "ORS multiple rules" , ()=>{
        const patterns = [{eventName: ['FOO']},{eventName: ['BAR']}]
        expect(allowEvent(patterns, {eventName: 'FOO'})).toBeTruthy()
        expect(allowEvent(patterns, {eventName: 'BAR'})).toBeTruthy()
    })


    describe("eventName", () => {
        it("allows single", () => {
            const pattern = {eventName: ['FOO']}
            const event = {eventName: 'FOO'}
            expect(allowEvent([pattern], event)).toBeTruthy()
        })
        it("rejects single", () => {
            const pattern = {eventName: ['FOO']}
            const event = {eventName: 'BAR'}
            expect(allowEvent([pattern], event)).toBeFalsy()
        })
        it("allows multiple", () => {
            const pattern = {eventName: ['BAZ', 'FOO', 'BAR']}
            const event = {eventName: 'FOO'}
            expect(allowEvent([pattern], event)).toBeTruthy()
        })
        it("rejects multiple", () => {
            const pattern = {eventName: ['FOO', 'BAR']}
            const event = {eventName: 'BAZ'}
            expect(allowEvent([pattern], event)).toBeFalsy()
        })
    })

    describe("dynamodb", () => {
        describe("Keys", () => {
            it("allows single property single pattern", () => {
                const pattern: FilterPatterns = {dynamodb: {Keys: {prop1: {S: ['FOO']}}}}
                const event = {dynamodb: {Keys: {prop1: {S: 'FOO'}}}}
                expect(allowEvent([pattern], event)).toBeTruthy()
            })
            it("rejects single property single pattern", () => {
                const pattern = {dynamodb: {Keys: {prop1: {S: ['FOO']}}}}
                const event = {dynamodb: {Keys: {prop1: {S: 'BAR'}}}}
                expect(allowEvent([pattern], event)).toBeFalsy()
            })
            it("allows single property multiple pattern", () => {
                const pattern = {dynamodb: {Keys: {prop1: {S: ['BAZ', 'FOO', 'BAR']}}}}
                const event = {dynamodb: {Keys: {prop1: {S: 'FOO'}}}}
                expect(allowEvent([pattern], event)).toBeTruthy()
            })
            it("rejects single property multiple pattern", () => {
                const pattern = {dynamodb: {Keys: {prop1: {S: ['FOO', 'BAR']}}}}
                const event = {dynamodb: {Keys: {prop1: {S: 'BAZ'}}}}
                expect(allowEvent([pattern], event)).toBeFalsy()
            })

            it("allows multiple properties single pattern", () => {
                const pattern = {dynamodb: {Keys: {prop1: {S: ['FOO']}, prop2: {S: ['BAR']}}}}
                const event = {dynamodb: {Keys: {prop1: {S: 'FOO'}, prop2: {S: 'BAR'}}}}
                expect(allowEvent([pattern], event)).toBeTruthy()
            })
            it("rejects multiple properties single pattern", () => {
                const pattern = {dynamodb: {Keys: {prop1: {S: ['FOO']}, prop2: {S: ['BAR']}}}}
                const eventData = [
                    ['FOOZ', 'BAR'],
                    ['FOO', 'BARZ'],
                ]
                eventData.forEach(([prop1, prop2]) => {
                    const event = {dynamodb: {Keys: {prop1: {S: prop1}, prop2: {S: prop2}}}}
                    expect(allowEvent([pattern], event)).toBeFalsy()
                })

            })
            it("allows multiple properties multiple pattern", () => {
                const pattern = {dynamodb: {Keys: {prop1: {S: ['FOO', 'BAR']}, prop2: {S: ['BAR', 'BAZ']}}}}
                const eventData = [
                    ['FOO', 'BAR'],
                    ['FOO', 'BAZ'],
                    ['BAR', 'BAR'],
                    ['BAR', 'BAZ'],
                ]
                eventData.forEach(([prop1, prop2]) => {
                    const event = {dynamodb: {Keys: {prop1: {S: prop1}, prop2: {S: prop2}}}}
                    expect(allowEvent([pattern], event)).toBeTruthy()
                })
            })
            it("rejects multiple properties multiple pattern", () => {
                const pattern = {dynamodb: {Keys: {prop1: {S: ['FOO', 'BAR']}, prop2: {S: ['BAR', 'BAZ']}}}}
                const eventData = [
                    ['FOOZ', 'BAR'],
                    ['FOOZ', 'BAZ'],
                    ['BARZ', 'BAR'],
                    ['BARZ', 'BAZ'],
                    ['FOO', 'BARZ'],
                    ['FOO', 'BAZZ'],
                    ['BAR', 'BARZ'],
                    ['BAR', 'BAZZ'],
                ]
                eventData.forEach(([prop1, prop2]) => {
                    const event = {dynamodb: {Keys: {prop1: {S: prop1}, prop2: {S: prop2}}}}
                    expect(allowEvent([pattern], event)).toBeFalsy()
                })
            })

            it("allows number", () => {
                const testData = [
                    [[100], 100],
                    [[99, 100, 101], 100]
                ] as [Array<number>, number][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern = {dynamodb: {Keys: {prop1: {N: patternData}}}}
                    const event = {dynamodb: {Keys: {prop1: {N: eventData}}}}
                    expect(allowEvent([pattern], event)).toBeTruthy()
                })
            })
            it("rejects number", () => {
                const testData = [
                    [[100], 101],
                    [[99, 100, 101], 102]
                ] as [Array<number>, number][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern = {dynamodb: {Keys: {prop1: {N: patternData}}}}
                    const event = {dynamodb: {Keys: {prop1: {N: eventData}}}}
                    expect(allowEvent([pattern], event)).toBeFalsy()
                })
            })

            it("allows binary", () => {
                const testData = [
                    [["abcd"], "abcd"],
                    [["abcd", "efgh"], "abcd"],
                    [["abcd", "efgh"], "efgh"],
                ] as [Array<string>, string][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern = {dynamodb: {Keys: {prop1: {B: patternData}}}}
                    const event = {dynamodb: {Keys: {prop1: {B: eventData}}}}
                    expect(allowEvent([pattern], event)).toBeTruthy()
                })
            })
            it("rejects binary", () => {
                const testData = [
                    [["abcd"], "efgh"],
                    [["abcd", "efgh"], "ijkl"],
                ] as [Array<string>, string][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern = {dynamodb: {Keys: {prop1: {B: patternData}}}}
                    const event = {dynamodb: {Keys: {prop1: {B: eventData}}}}
                    expect(allowEvent([pattern], event)).toBeFalsy()
                })
            })

            it("allows boolean", () => {
                const testData = [
                    [[true], true],
                    [[false, true], true],
                    [[false, true], false]
                ] as [Array<boolean>, boolean][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern = {dynamodb: {Keys: {prop1: {BOOL: patternData}}}}
                    const event = {dynamodb: {Keys: {prop1: {BOOL: eventData}}}}
                    expect(allowEvent([pattern], event)).toBeTruthy()
                })
            })
            it("rejects boolean", () => {
                const testData = [
                    [[true], false],
                    [[false], true],
                ] as [Array<boolean>, boolean][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern = {dynamodb: {Keys: {prop1: {BOOL: patternData}}}}
                    const event = {dynamodb: {Keys: {prop1: {BOOL: eventData}}}}
                    expect(allowEvent([pattern], event)).toBeFalsy()
                })
            })

            it("allows empty rule", () => {
                const pattern = {dynamodb: {Keys: {prop1: {S: ['']}}}}
                const event = {dynamodb: {Keys: {prop1: {S: ''}}}}
                expect(allowEvent([pattern], event)).toBeTruthy()
            })
            it("rejects empty rule", () => {
                const pattern = {dynamodb: {Keys: {prop1: {S: ['']}}}}
                const event = {dynamodb: {Keys: {prop1: {S: 'FOO'}}}}
                expect(allowEvent([pattern], event)).toBeFalsy()
            })

            it("allows null rule", () => {
                const pattern: FilterPatterns = {dynamodb: {Keys: {prop1: [null]}}}
                const event: DynamoStreamsEventFilters = {dynamodb: {Keys: {prop1: {NULL: ''}}}}
                expect(allowEvent([pattern], event)).toBeTruthy()
            })
            it("rejects null rule", () => {
                const pattern: FilterPatterns = {dynamodb: {Keys: {prop1: [null]}}}
                const event: DynamoStreamsEventFilters = {dynamodb: {Keys: {prop1: {S: 'FOO'}}}}
                expect(allowEvent([pattern], event)).toBeFalsy()
            })

            it("allows not rule", () => {
                const testData = [
                    [["FOO"], "BAR"],
                    [["FOO", "BAZ"], "BAR"],
                ] as [Array<string>, string][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern: FilterPatterns = {dynamodb: {Keys: {prop1: [{"anything-but": patternData}]}}}
                    const event: DynamoStreamsEventFilters = {dynamodb: {Keys: {prop1: {S: eventData}}}}
                    expect(allowEvent([pattern], event)).toBeTruthy()
                })
            })
            it("rejects not rule", () => {
                const testData = [
                    [["FOO"], "FOO"],
                    [["FOO", "BAR"], "BAR"],
                ] as [Array<string>, string][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern: FilterPatterns = {dynamodb: {Keys: {prop1: [{"anything-but": patternData}]}}}
                    const event: DynamoStreamsEventFilters = {dynamodb: {Keys: {prop1: {S: eventData}}}}
                    expect(allowEvent([pattern], event)).toBeFalsy()
                })
            })

            it("allows numeric rule", () => {
                const testData = [
                    [['=', 1], 1], [['=', 0], 0], [['=', -1], -1],
                    [['<', 2], 1], [['<', 1], 0], [['<', 0], -1],
                    [['<=', 2], 2], [['<=', 2], 1], [['<=', 1], 1], [['<=', 1], 0], [['<=', 0], 0], [['<=', 0], -1], [['<=', -1], -1],
                    [['>', 1], 2], [['>', 0], 1], [['>', -1], 0],
                    [['>=', 2], 2], [['>=', 1], 2], [['>=', 1], 1], [['>=', 0], 1], [['>=', 0], 0], [['>=', -1], 0], [['>=', -1], -1],
                ] as [NumericSingle, number][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern: FilterPatterns = {dynamodb: {Keys: {prop1: [{numeric: patternData}]}}}
                    const event: DynamoStreamsEventFilters = {dynamodb: {Keys: {prop1: {N: eventData}}}}
                    expect(allowEvent([pattern], event)).toBeTruthy()
                })
            })
            it("rejects numeric rule", () => {
                const testData = [
                    [['=', 1], 2], [['=', 0], 1], [['=', -1], -2], [['=', -1], 1], [['=', 1], -1],
                    [['<', 1], 2], [['<', 1], 1], [['<', 0], 1], [['<', 0], 0], [['<', -1], 0], [['<', -1], -1],
                    [['<=', 1], 2], [['<=', 0], 1], [['<=', -1], 0],
                    [['>', 2], 1], [['>', 1], 1], [['>', 1], 0], [['>', 0], 0], [['>', 0], -1], [['>', -1], -1],
                    [['>=', 2], 1], [['>=', 1], 0], [['>=', 0], -1],
                ] as [NumericSingle, number][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern: FilterPatterns = {dynamodb: {Keys: {prop1: [{numeric: patternData}]}}}
                    const event: DynamoStreamsEventFilters = {dynamodb: {Keys: {prop1: {N: eventData}}}}
                    expect(allowEvent([pattern], event)).toBeFalsy()
                })
            })

            it("allows numeric range rule", () => {
                const testData = [
                    [['>', 5, '<', 7], 6],
                    [['>', 5, '<=', 7], 6], [['>', 5, '<=', 7], 7],
                    [['>=', 5, '<', 7], 5], [['>=', 5, '<', 7], 6],
                    [['>=', -1, '<', 2], -1], [['>=', -1, '<', 2], 0], [['>=', -1, '<', 2], 1],
                    [['>', -2, '<=', 1], -1], [['>', -2, '<=', 1], 0], [['>', -2, '<=', 1], 1],
                ] as [NumericRange, number][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern: FilterPatterns = {dynamodb: {Keys: {prop1: [{numeric: patternData}]}}}
                    const event: DynamoStreamsEventFilters = {dynamodb: {Keys: {prop1: {N: eventData}}}}
                    expect(allowEvent([pattern], event)).toBeTruthy()
                })
            })
            it("rejects numeric range rule", () => {
                const testData = [
                    [['>', 5, '<', 7], 5], [['>', 5, '<', 7], 7],
                    [['>', 5, '<=', 7], 5], [['>', 5, '<=', 7], 8],
                    [['>=', 5, '<', 7], 4], [['>=', 5, '<', 7], 7],
                    [['>=', -1, '<', 2], -2], [['>=', -1, '<', 2], 2],
                    [['>', -2, '<=', 1], -2], [['>', -2, '<=', 1], 2],
                ] as [NumericRange, number][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern: FilterPatterns = {dynamodb: {Keys: {prop1: [{numeric: patternData}]}}}
                    const event: DynamoStreamsEventFilters = {dynamodb: {Keys: {prop1: {N: eventData}}}}
                    expect(allowEvent([pattern], event)).toBeFalsy()
                })
            })

            it("allows exists rule", () => {
                const testData = [
                    [true, {S: "FOO"}],
                    [true, {N: 1}],
                    [false, undefined],
                ] as [boolean, DynamoScalar | undefined][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern: FilterPatterns = {dynamodb: {Keys: {prop1: [{exists: patternData}]}}}
                    const event: DynamoStreamsEventFilters = {dynamodb: {Keys: {prop1: eventData}}}
                    expect(allowEvent([pattern], event)).toBeTruthy()
                })
            })
            it("rejects exists rule", () => {
                const testData = [
                    [false, {S: "FOO"}],
                    [false, {N: 1}],
                    [true, undefined],
                ] as [boolean, DynamoScalar | undefined][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern: FilterPatterns = {dynamodb: {Keys: {prop1: [{exists: patternData}]}}}
                    const event: DynamoStreamsEventFilters = {dynamodb: {Keys: {prop1: eventData}}}
                    expect(allowEvent([pattern], event)).toBeFalsy()
                })
            })

            it("allows begins with rule", () => {
                const testData = [
                    ["FO", {S: "FOO"}],
                    ["FO", {S: "FO"}],
                    ["BA", {S: "BAR"}],
                    ["BA", {S: "BA"}],
                ] as [string, DynamoScalar][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern: FilterPatterns = {dynamodb: {Keys: {prop1: [{prefix: patternData}]}}}
                    const event: DynamoStreamsEventFilters = {dynamodb: {Keys: {prop1: eventData}}}
                    expect(allowEvent([pattern], event)).toBeTruthy()
                })
            })
            it("rejects begins with rule", () => {
                const testData = [
                    ["FO", {S: "1FOO"}],
                    ["BA", {S: "ABAR"}],
                ] as [string, DynamoScalar][]
                testData.forEach(([patternData, eventData]) => {
                    const pattern: FilterPatterns = {dynamodb: {Keys: {prop1: [{prefix: patternData}]}}}
                    const event: DynamoStreamsEventFilters = {dynamodb: {Keys: {prop1: eventData}}}
                    expect(allowEvent([pattern], event)).toBeFalsy()
                })
            })
        })
    })
})