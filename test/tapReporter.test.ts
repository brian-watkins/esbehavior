import { expect } from 'chai'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { Condition, Step } from '../src/Assumption.js'
import { ClaimResult, InvalidClaim, ValidClaim } from '../src/Claim.js'
import { example, effect, condition, validate, behavior, step, Script, Effect } from '../src/index.js'
import { Reporter } from '../src/Reporter.js'
import { TAPReporter } from '../src/TAPReporter.js'
import { FakeReportWriter } from './helpers/FakeReportWriter.js'

test("when a report starts", async () => {
  const writer = new FakeReportWriter()
  const reporter = new TAPReporter(writer)

  reporter.start()

  writer.expectLines([
    "TAP version 13"
  ])
})

test("when a report ends", () => {
  const writer = new FakeReportWriter()
  const reporter = new TAPReporter(writer)

  reporter.end({
    behaviors: 1,
    examples: 1,
    valid: 3,
    invalid: 2,
    skipped: 4
  })

  writer.expectLines([
    "1..9",
    "# tests 9",
    "# pass 3",
    "# fail 2",
    "# skip 4"
  ])
})

test("when a report is terminated", () => {
  const writer = new FakeReportWriter()
  const reporter = new TAPReporter(writer)

  reporter.terminate({
    stack: "some-stack-trace"
  })

  writer.expectLines([
    "Bail out! some-stack-trace"
  ])
})

test("when a behavior starts", () => {
  const writer = new FakeReportWriter()
  const reporter = new TAPReporter(writer)

  reporter.startBehavior("some behavior")

  writer.expectLines([
    "# Behavior: some behavior"
  ])
})

test("when an example starts with a description", () => {
  const writer = new FakeReportWriter()
  const reporter = new TAPReporter(writer)

  reporter.startExample("some example")

  writer.expectLines([
    "# Example: some example"
  ])
})

test("when an example starts with no description", () => {
  const writer = new FakeReportWriter()
  const reporter = new TAPReporter(writer)

  reporter.startExample()

  writer.expectLines([
    "# Example"
  ])
})


const validClaimBehavior = (name: string, writeToReport: (reporter: Reporter, claimResult: ClaimResult) => void, description: string) => {
  test(`when a valid ${name} is reported`, () => {
    const writer = new FakeReportWriter()
    const reporter = new TAPReporter(writer)
  
    writeToReport(reporter, new ValidClaim(description, "some-location"))
  
    writer.expectLines([
      `ok ${description}`
    ])
  })  
}

const scriptContext = {
  location: "",
  script: {}
}

validClaimBehavior("condition", (reporter, claimResult) => {
  reporter.recordAssumption(scriptContext, new Condition("some condition", () => {}), claimResult)
}, "Prepare: some condition")

validClaimBehavior("step", (reporter, claimResult) => {
  reporter.recordAssumption(scriptContext, new Step("some step", () => {}), claimResult)
}, "Perform: some step")

validClaimBehavior("observation", (reporter, claimResult) => {
  reporter.recordObservation(claimResult)
}, "some effect")


const skippedClaimBehavior = (name: string, writeToReport: (reporter: Reporter) => void, description: string) => {
  test(`when a skipped ${name} is reported`, () => {
    const writer = new FakeReportWriter()
    const reporter = new TAPReporter(writer)
  
    writeToReport(reporter)
  
    writer.expectLines([
      `ok ${description} # SKIP`
    ])
  })  
}

skippedClaimBehavior("condition", (reporter) => {
  reporter.skipAssumption(new Condition("cool condition", () => {}))
}, "Prepare: cool condition")

skippedClaimBehavior("step", (reporter) => {
  reporter.skipAssumption(new Step("cool step", () => {}))
}, "Perform: cool step")

skippedClaimBehavior("observation", (reporter) => {
  const skippedEffect = (new Effect("cool observation", () => {})).skip(scriptContext)
  reporter.recordObservation(skippedEffect)
}, "cool observation")


const invalidClaimBehavior = (name: string, writeToReport: (reporter: Reporter, claim: ClaimResult) => void, expectedDescription: string) => {
  test(`when an invalid ${name} is reported`, () => {
    const writer = new FakeReportWriter()
    const reporter = new TAPReporter(writer)

    writeToReport(reporter, new InvalidClaim(expectedDescription, "some-location", { expected: "something", actual: "nothing", operator: "equals", stack: "blah" }))

    writer.expectLines([
      `not ok ${expectedDescription}`,
      "  ---",
      "  operator: equals",
      "  expected: \"something\"",
      "  actual:   \"nothing\"",
      "  stack: |-",
      "    blah",
      "  ..."
    ])
  })

  test(`when an invalid ${name} is reported with line breaks and TAP-like characters`, () => {
    const writer = new FakeReportWriter()
    const reporter = new TAPReporter(writer)

    writeToReport(reporter, new InvalidClaim(expectedDescription, "some-location", {
      expected: "# Behavior: A Sample Behavior\n# Example: Comparing some numbers\n# tests 1\n# pass 1\n# fail 0\n# skip 0",
      actual: "# Behavior: A Sample Behavior\n# Example: Comparing some numbers",
      operator: "equals",
      stack: "blah"
    }))

    writer.expectLines([
      `not ok ${expectedDescription}`,
      "  ---",
      "  operator: equals",
      "  expected: \"# Behavior: A Sample Behavior\\n# Example: Comparing some numbers\\n# tests 1\\n# pass 1\\n# fail 0\\n# skip 0\"",
      "  actual:   \"# Behavior: A Sample Behavior\\n# Example: Comparing some numbers\"",
      "  stack: |-",
      "    blah",
      "  ..."
    ])
  })

  test(`when an invalid ${name} is reported with non-string actual and expected`, () => {
    const writer = new FakeReportWriter()
    const reporter = new TAPReporter(writer)

    writeToReport(reporter, new InvalidClaim(expectedDescription, "some-location", {
      expected: 7,
      actual: [9, 10, 11],
      operator: "equals",
      stack: "blah"
    }))

    writer.expectLines([
      `not ok ${expectedDescription}`,
      "  ---",
      "  operator: equals",
      "  expected: 7",
      "  actual:   [9,10,11]",
      "  stack: |-",
      "    blah",
      "  ..."
    ])
  })

  test(`when an invalid ${name} is reported with a raw error`, () => {
    const writer = new FakeReportWriter()
    const reporter = new TAPReporter(writer)

    const error = new Error()
    error.stack = "funny stack"

    writeToReport(reporter, new InvalidClaim(expectedDescription, "some-location", error))

    writer.expectLines([
      `not ok ${expectedDescription}`,
      "  ---",
      "  stack: |-",
      "    funny stack",
      "  ..."
    ])
  })
}

invalidClaimBehavior("condition", (reporter, claimResult) => {
  reporter.recordAssumption(scriptContext, new Condition("failed condition", () => { }), claimResult)
}, "Prepare: failed condition")

invalidClaimBehavior("step", (reporter, claimResult) => {
  reporter.recordAssumption(scriptContext, new Step("failed step", () => { }), claimResult)
}, "Perform: failed step")

invalidClaimBehavior("observation", (reporter, claimResult) => {
  reporter.recordObservation(claimResult)
}, "failed observation")


const noErrorBehavior = (name: string, failingScriptWith: (error: any) => Script<void>, expectedDescription: string) => {
  test(`when an invalid ${name} is reported with some object that is not an error, ie with no stack property`, async () => {
    const writer = new FakeReportWriter()
    const reporter = new TAPReporter(writer)

    const error = { message: "you failed" }

    await validate([
      behavior("bad behavior", [
        example()
          .description("some object thrown that is not an error")
          .script(failingScriptWith(error))
      ])
    ], { reporter })

    writer.expectLines([
      "TAP version 13",
      "# Behavior: bad behavior",
      "# Example: some object thrown that is not an error",
      `not ok ${expectedDescription}`,
      "  ---",
      "  error: {\"message\":\"you failed\"}",
      "  ...",
      "1..1",
      "# tests 1",
      "# pass 0",
      "# fail 1",
      "# skip 0"
    ])
  })
}

noErrorBehavior("condition", (error) => {
  return {
    prepare: [
      condition<void>("failing condition", () => { throw error })
    ]
  }
}, "Prepare: failing condition")

noErrorBehavior("step", (error) => {
  return {
    perform: [
      step<void>("failing step", () => { throw error })
    ]
  }
}, "Perform: failing step")

noErrorBehavior("observation", (error) => {
  return {
    observe: [
      effect<void>("failing observation", () => { throw error })
    ]
  }
}, "failing observation")


const errorLocationBehavior = (name: string, failingScript: () => Script<void>) => {
  test(`when a failure is reported in a ${name}`, async () => {
    const writer = new FakeReportWriter()
    const reporter = new TAPReporter(writer)
  
    await validate([
      behavior("bad behavior", [
        example()
          .description("failing condition")
          .script(failingScript())
      ])
    ], { reporter })
  
    const atLines = writer.logLines.filter((line) => {
      return line.startsWith("  at:")
    })
  
    assert.equal(atLines.length, 1, "Expected to see line indicating error")
  })
}

errorLocationBehavior("condition", () => {
  return {
    prepare: [
      condition("something throws an error", () => {
        expect(7).to.equal(9)
      }),
    ]
  }
})

errorLocationBehavior("step", () => {
  return {
    perform: [
      step("something throws an error", () => {
        expect(7).to.equal(9)
      }),
    ]
  }
})

errorLocationBehavior("observation", () => {
  return {
    observe: [
      effect("something throws an error", () => {
        expect(7).to.equal(9)
      }),
    ]
  }
})

test.run()