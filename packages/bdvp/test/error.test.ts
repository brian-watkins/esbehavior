import { test } from 'uvu'
import { example, effect, condition, validate, behavior } from '../src/index.js'
import { behaviorReport, failingCondition, FakeReportWriter, exampleReport, skippedCondition, skippedObservation, invalidObservation } from './helpers/FakeReportWriter.js'

test("multiline actual and expected in error with bad TAP-like characters", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("behavior", [
      example()
        .description("failing condition with multiline TAP-like output in actual")
        .script({
          assume: [
            condition("something throws an error", () => {
              const error: any = new Error()
              error.expected = "# Behavior: A Sample Behavior\n# Example: Comparing some numbers\n# tests 1\n# pass 1\n# fail 0\n# skip 0"
              error.actual = "# Behavior: A Sample Behaviorsssss\n# Example: Comparing some numbers\n# tests 1\n# pass 1\n# fail 0\n# skip 0"
              error.operator = "equals"
              error.stack = "funny stack"
              throw error
            }),
            condition("there is another condition", () => { })
          ],
          observe: [
            effect("does something that will get skipped", () => { })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("behavior", [
      exampleReport("failing condition with multiline TAP-like output in actual", [
        failingCondition("something throws an error", {
          operator: "equals",
          expected: "\"# Behavior: A Sample Behavior\\n# Example: Comparing some numbers\\n# tests 1\\n# pass 1\\n# fail 0\\n# skip 0\"",
          actual: '\"# Behavior: A Sample Behaviorsssss\\n# Example: Comparing some numbers\\n# tests 1\\n# pass 1\\n# fail 0\\n# skip 0\"',
          stack: "funny stack"
        }),
        skippedCondition("there is another condition")
      ], [
        skippedObservation("does something that will get skipped")
      ])
    ])
  ], "it escapes line breaks in the actual output")
})

test("non-string actual and expected", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("behavior", [
      example()
        .description("failing condition with non-string actual and expected")
        .script({
          assume: [
            condition("something throws an error", () => {
              const error: any = new Error()
              error.expected = 7
              error.actual = [ 9, 10, 11 ]
              error.operator = "equals"
              error.stack = "funny stack"
              throw error
            }),
            condition("there is another condition", () => { })
          ],
          observe: [
            effect("does something that will get skipped", () => { })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("behavior", [
      exampleReport("failing condition with non-string actual and expected", [
        failingCondition("something throws an error", {
          operator: "equals",
          expected: "7",
          actual: "[9,10,11]",
          stack: "funny stack"
        }),
        skippedCondition("there is another condition")
      ], [
        skippedObservation("does something that will get skipped")
      ])
    ])
  ], "it escapes line breaks in the actual output")
})

test("provide reference to the failure in the Condition block", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("behavior", [
      example()
        .description("failing condition with non-string actual and expected")
        .script({
          assume: [
            condition("something throws an error", () => {
              const error: any = new Error()
              error.expected = 7
              error.actual = [ 9, 10, 11 ]
              error.operator = "equals"
              error.stack = `AssertionError: 'Stuff!' == 8
at Function.proclaim.equal (/Users/bwatkins/work/beep/packages/node-sample/node_modules/proclaim/lib/proclaim.js:38:4)
at Condition.execute (file:///Users/bwatkins/work/beep/packages/node-sample/specs/sample.doc.ts:19:20)
at Effect.validate (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Claim.js:9:32)
at ValidateMode.handleObservation (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:104:48)
at ExampleRun.runScript (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:79:29)
at ExampleRun.execute (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:68:13)
at BDVPExample.run (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:49:9)
at Behavior.execute (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Behavior.js:41:34)
at BehaviorCollection.run (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Behavior.js:16:35)
at validate (file:///Users/bwatkins/work/beep/packages/bdvp/dist/index.js:13:25)`
              throw error
            }),
            condition("there is another condition", () => { })
          ],
          observe: [
            effect("does something that will get skipped", () => { })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("behavior", [
      exampleReport("failing condition with non-string actual and expected", [
        failingCondition("something throws an error", {
          operator: "equals",
          expected: "7",
          actual: "[9,10,11]",
          at: "Condition.execute (file:///Users/bwatkins/work/beep/packages/node-sample/specs/sample.doc.ts:19:20)",
          stack: `AssertionError: 'Stuff!' == 8
at Function.proclaim.equal (/Users/bwatkins/work/beep/packages/node-sample/node_modules/proclaim/lib/proclaim.js:38:4)
at Condition.execute (file:///Users/bwatkins/work/beep/packages/node-sample/specs/sample.doc.ts:19:20)
at Effect.validate (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Claim.js:9:32)
at ValidateMode.handleObservation (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:104:48)
at ExampleRun.runScript (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:79:29)
at ExampleRun.execute (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:68:13)
at BDVPExample.run (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:49:9)
at Behavior.execute (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Behavior.js:41:34)
at BehaviorCollection.run (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Behavior.js:16:35)
at validate (file:///Users/bwatkins/work/beep/packages/bdvp/dist/index.js:13:25)`
        }),
        skippedCondition("there is another condition")
      ], [
        skippedObservation("does something that will get skipped")
      ])
    ])
  ], "it escapes line breaks in the actual output")
})


test("provide reference to the failure in the Execute block", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("behavior", [
      example()
        .description("failing observation with non-string actual and expected")
        .script({
          observe: [
            effect("something throws an error", () => {
              const error: any = new Error()
              error.expected = 7
              error.actual = [ 9, 10, 11 ]
              error.operator = "equals"
              error.stack = `AssertionError: 'Stuff!' == 8
at Function.proclaim.equal (/Users/bwatkins/work/beep/packages/node-sample/node_modules/proclaim/lib/proclaim.js:38:4)
at Effect.execute (file:///Users/bwatkins/work/beep/packages/node-sample/specs/sample.doc.ts:19:20)
at Effect.validate (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Claim.js:9:32)
at ValidateMode.handleObservation (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:104:48)
at ExampleRun.runScript (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:79:29)
at ExampleRun.execute (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:68:13)
at BDVPExample.run (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:49:9)
at Behavior.execute (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Behavior.js:41:34)
at BehaviorCollection.run (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Behavior.js:16:35)
at validate (file:///Users/bwatkins/work/beep/packages/bdvp/dist/index.js:13:25)`
              throw error
            })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("behavior", [
      exampleReport("failing observation with non-string actual and expected", [], [
        invalidObservation("something throws an error", {
          operator: "equals",
          expected: "7",
          actual: "[9,10,11]",
          at: "Effect.execute (file:///Users/bwatkins/work/beep/packages/node-sample/specs/sample.doc.ts:19:20)",
          stack: `AssertionError: 'Stuff!' == 8
at Function.proclaim.equal (/Users/bwatkins/work/beep/packages/node-sample/node_modules/proclaim/lib/proclaim.js:38:4)
at Effect.execute (file:///Users/bwatkins/work/beep/packages/node-sample/specs/sample.doc.ts:19:20)
at Effect.validate (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Claim.js:9:32)
at ValidateMode.handleObservation (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:104:48)
at ExampleRun.runScript (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:79:29)
at ExampleRun.execute (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:68:13)
at BDVPExample.run (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Example.js:49:9)
at Behavior.execute (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Behavior.js:41:34)
at BehaviorCollection.run (file:///Users/bwatkins/work/beep/packages/bdvp/dist/Behavior.js:16:35)
at validate (file:///Users/bwatkins/work/beep/packages/bdvp/dist/index.js:13:25)`
        })
      ])
    ])
  ], "it escapes line breaks in the actual output")
})


test.run()