import { expect } from 'chai'
import { test } from 'uvu'
import { validate, example, effect, condition, skip, behavior } from '../src/index.js'
import { anotherScript, behaviorReport, exampleReport, FakeReporter, invalidObservation, passingCondition, skippedCondition, skippedObservation, validObservation } from './helpers/FakeReporter.js'

test("it runs multiple scripts in one example", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("multiple scripts", [
      example({ subject: () => ({ touched: 0 }) })
        .description("multiple scripts")
        .script({
          assume: [
            condition("it touches the context", (context) => { context.touched++ })
          ],
          observe: [
            effect("the first script works", (context) => {
              expect(context.touched).to.equal(1)
            })
          ]
        })
        .andThen({
          assume: [
            condition("it touches the context again", (context) => { context.touched++ }),
            condition("it touches the context and again", (context) => { context.touched++ })
          ],
          observe: [
            effect("part of the second script works", (context) => {
              expect(context.touched).to.equal(3)
            }),
            effect("the second script fails", (context) => {
              const error: any = new Error()
              error.expected = "a thing"
              error.actual = "nothing"
              error.operator = "equals"
              error.stack = "cool stack"
              throw error
            })
          ]
        })
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    behaviorReport("multiple scripts", [
      exampleReport("multiple scripts", [
        passingCondition("it touches the context"),
      ], [
        validObservation("the first script works")
      ]),
      anotherScript([
        passingCondition("it touches the context again"),
        passingCondition("it touches the context and again"),
      ], [
        validObservation("part of the second script works"),
        invalidObservation("the second script fails", {
          operator: "equals", expected: "a thing", actual: "nothing", stack: "cool stack"
        })
      ])
    ])
  ], "it prints the results of both scripts")
})

test("it skips all scripts when the example is skipped", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("example with multiple scripts", [
      skip.example({ subject: () => ({ touched: 0 }) })
        .description("example is skipped")
        .script({
          assume: [
            condition("it touches the context", (context) => { context.touched++ })
          ],
          observe: [
            effect("the first script works", (context) => {
              expect(context.touched).to.equal(1)
            })
          ]
        })
        .andThen({
          assume: [
            condition("it touches the context again", (context) => { context.touched++ }),
            condition("it touches the context and again", (context) => { context.touched++ })
          ],
          observe: [
            effect("the second script works", (context) => {
              expect(context.touched).to.equal(3)
            })
          ]
        })
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    behaviorReport("example with multiple scripts", [
      exampleReport("example is skipped", [
        skippedCondition("it touches the context"),
      ], [
        skippedObservation("the first script works")
      ]),
      anotherScript([
        skippedCondition("it touches the context again"),
        skippedCondition("it touches the context and again"),
      ], [
        skippedObservation("the second script works")
      ])
    ])
  ], "it prints the results of both scripts")
})


test("it skips remaining plans if any observations fail", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("multiple scripts", [
      example({ subject: () => ({ touched: 0 }) })
        .description("first script fails")
        .script({
          assume: [
            condition("it touches the context", (context) => { context.touched++ })
          ],
          observe: [
            effect("the context was touched", (context) => {
              expect(context.touched).to.equal(1)
            })
          ]
        })
        .andThen({
          assume: [
            condition("it touches the context again", (context) => { context.touched++ })
          ],
          observe: [
            effect("the second script fails", (context) => {
              const error: any = new Error()
              error.expected = "something"
              error.actual = "nothing"
              error.operator = "equals"
              error.stack = "stack"
              throw error
            })
          ]
        })
        .andThen({
          assume: [
            condition("it touches the context another time", (context) => { context.touched++ }),
            condition("it touches the context for the last time", (context) => { context.touched++ })
          ],
          observe: [
            effect("the second script would fail if not skipped", (context) => {
              expect(context.touched).to.equal(888)
            })
          ]
        })
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    behaviorReport("multiple scripts", [
      exampleReport("first script fails", [
        passingCondition("it touches the context")
      ], [
        validObservation("the context was touched")
      ]),
      anotherScript([
        passingCondition("it touches the context again"),
      ], [
        invalidObservation("the second script fails", {
          operator: "equals", expected: "something", actual: "nothing", stack: "stack"
        })
      ]),
      anotherScript([
        skippedCondition("it touches the context another time"),
        skippedCondition("it touches the context for the last time"),
      ], [
        skippedObservation("the second script would fail if not skipped")
      ])
    ])
  ], "it prints the results of both scripts")
})

test.run()