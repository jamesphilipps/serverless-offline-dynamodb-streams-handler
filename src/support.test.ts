import {StringKeyObject} from "./types";
import {FunctionDefinition} from "serverless";
import {Event, getFunctionsWithStreamEvents} from "./support";

describe("getFunctionsWithStreamEvents", () => {
    it("filters events correctly", () => {
        const createFunction = (name: string, events: Event[]) => ({name, events})
        const createApiEvent = () => ({http: {path: '/hello', method: 'post'}})
        const createStreamEvent = () => ({stream: {type: 'kinesis', arn: 'arn:aws:kinesis:region:XXXX'}})
        const createDynamoStreamEvent = (arn) => ({stream: {type: 'dynamodb', arn}})

        const functions: StringKeyObject<FunctionDefinition> = {
            f1: createFunction("f1", [
                createApiEvent()
            ]),
            f2: createFunction("f2", [
                createStreamEvent()
            ]),
            f3: createFunction("f3", [
                createDynamoStreamEvent("dynamo1")
            ]),
            f4: createFunction("f4", [
                createApiEvent(),
                createDynamoStreamEvent("dynamo2")
            ]),
            f5: createFunction("f6", [
                createStreamEvent(),
                createDynamoStreamEvent("dynamo3")
            ]),
            f6: createFunction("f6", [
                createDynamoStreamEvent("dynamo4"),
                createDynamoStreamEvent("dynamo5")
            ]),
        }
        const getFunction = (key: string) => functions[key]

        const result = getFunctionsWithStreamEvents(getFunction)(Object.keys(functions))
        expect(result.length).toEqual(4)

        expect(result[0].functionKey).toEqual("f3")
        expect(result[0].functionDefinition).toEqual(functions.f3)
        expect(result[0].events.length).toEqual(1)
        expect(result[0].events[0]).toEqual(functions.f3.events[0])

        expect(result[1].functionKey).toEqual("f4")
        expect(result[1].functionDefinition).toEqual(functions.f4)
        expect(result[1].events.length).toEqual(1)
        expect(result[1].events[0]).toEqual(functions.f4.events[1])

        expect(result[2].functionKey).toEqual("f5")
        expect(result[2].functionDefinition).toEqual(functions.f5)
        expect(result[2].events.length).toEqual(1)
        expect(result[2].events[0]).toEqual(functions.f5.events[1])

        expect(result[3].functionKey).toEqual("f6")
        expect(result[3].functionDefinition).toEqual(functions.f6)
        expect(result[3].events.length).toEqual(2)
        expect(result[3].events[0]).toEqual(functions.f6.events[0])
        expect(result[3].events[1]).toEqual(functions.f6.events[1])

    })
})