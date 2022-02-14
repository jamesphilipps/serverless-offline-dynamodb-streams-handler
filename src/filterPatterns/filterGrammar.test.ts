// noinspection JSUnusedAssignment

import {EmptyRule, Filter, NumericRule} from "./filterGrammar";

describe("Filter Grammar", () => {
    it("compiles correctly", () => {
        // Test grammar for filters against the typescript compiler. All of these rules are valid
        let f: Filter

        // Simple dynamo scalars + OR logic
        f = {S: ['FOO']}
        f = {S: ['FOO', 'BAR']}
        f = {N: [1]}
        f = {N: [1, 2]}
        f = {B: ['abcd']}
        f = {B: ['abcd', 'efgh']}
        f = {BOOL: [true]}
        f = {BOOL: [false]}
        f = {BOOL: [true, false]}
        f = {NULL: ""}

        // Single rules
        const nullRule = null
        const emptyRule = "" as EmptyRule
        const numericEqualsRule = {numeric: ['=', 100]} as NumericRule
        const stringNotRule = {'anything-but': ['FOO']}
        const stringNotRuleOR = {'anything-but': ['FOO', 'BAR']}
        const numericNotRule = {'anything-but': [1]}
        const numericNotRuleOR = {'anything-but': [1, 2]}
        const existsRule = {exists: true}
        const notExistsRule = {exists: false}
        const beginsWithRule = {prefix: 'FOO'}

        f = [nullRule]
        f = [emptyRule]
        f = [numericEqualsRule]
        f = [stringNotRule]
        f = [stringNotRuleOR]
        f = [numericNotRule]
        f = [numericNotRuleOR]
        f = [existsRule]
        f = [notExistsRule]
        f = [beginsWithRule]

        // Combination rule
        f = [nullRule, emptyRule, numericEqualsRule]
    })
})
