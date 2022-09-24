import { expect } from 'chai'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { Fact } from '../src/Presupposition.js'
import { ClaimResult, InvalidClaim, SkippedClaim, ValidClaim } from '../src/Claim.js'
import { example, effect, fact, validate, behavior, step, Script, Effect, Step } from '../src/index.js'
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


const validClaimBehavior = (name: string, writeToReport: (reporter: Reporter, claimResult: ClaimResult) => void, claimDescription: string, reportedDescription: string) => {
  test(`when a valid ${name} is reported`, () => {
    const writer = new FakeReportWriter()
    const reporter = new TAPReporter(writer)
  
    writeToReport(reporter, new ValidClaim(claimDescription))
  
    writer.expectLines([
      `ok ${reportedDescription}`
    ])
  })
}

const scriptContext = {
  location: "",
  script: {}
}

validClaimBehavior("condition", (reporter, claimResult) => {
  reporter.recordPresupposition(claimResult)
}, "some condition", "Suppose: some condition")

validClaimBehavior("step", (reporter, claimResult) => {
  reporter.recordAction(claimResult)
}, "some step", "Perform: some step")

validClaimBehavior("observation", (reporter, claimResult) => {
  reporter.recordObservation(claimResult)
}, "some effect", "some effect")


const validGroupedClaimBehavior = (name: string, writeToReport: (reporter: Reporter, claimResult: ClaimResult) => void, expectedIdentifier: string) => {
  test(`when a valid ${name} is reported`, () => {
    const writer = new FakeReportWriter()
    const reporter = new TAPReporter(writer)

    const nestedOutcome = new ValidClaim("nested outcome")
    nestedOutcome.subsumedResults = [
      new ValidClaim("nested claim 1"),
      new ValidClaim("nested claim 2")
    ]

    const outcome = new ValidClaim("some-description")
    outcome.subsumedResults = [
      new ValidClaim("sub-claim 1"),
      nestedOutcome,
      new ValidClaim("sub-claim 2")
    ]

    writeToReport(reporter, outcome)

    writer.expectLines([
      `# > ${expectedIdentifier}some-description`,
      `ok > ${expectedIdentifier}sub-claim 1`,
      `# > > ${expectedIdentifier}nested outcome`,
      `ok > > ${expectedIdentifier}nested claim 1`,
      `ok > > ${expectedIdentifier}nested claim 2`,
      `ok > ${expectedIdentifier}sub-claim 2`,
    ])
  })
}

validGroupedClaimBehavior("outcome", (reporter, claimResult) => {
  reporter.recordObservation(claimResult)
}, "")

validGroupedClaimBehavior("procedure", (reporter, claimResult) => {
  reporter.recordAction(claimResult)
}, "Perform: ")

validGroupedClaimBehavior("situation", (reporter, claimResult) => {
  reporter.recordPresupposition(claimResult)
}, "Suppose: ")


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
  const skipped = (new Fact("cool condition", () => {})).skip()
  reporter.recordPresupposition(skipped)
}, "Suppose: cool condition")

skippedClaimBehavior("step", (reporter) => {
  const skipped = (new Step("cool step", () => {})).skip()
  reporter.recordAction(skipped)
}, "Perform: cool step")

skippedClaimBehavior("observation", (reporter) => {
  const skipped = (new Effect("cool observation", () => {})).skip()
  reporter.recordObservation(skipped)
}, "cool observation")


const skippedGroupedClaimBehavior = (name: string, writeToReport: (reporter: Reporter, claimResult: ClaimResult) => void, expectedIdentifier: string) => {
  test(`when a skipped ${name} is reported`, () => {
    const writer = new FakeReportWriter()
    const reporter = new TAPReporter(writer)

    const nestedOutcome = new SkippedClaim("nested outcome")
    nestedOutcome.subsumedResults = [
      new SkippedClaim("nested claim 1"),
      new SkippedClaim("nested claim 2")
    ]

    const outcome = new SkippedClaim("some-description")
    outcome.subsumedResults = [
      new SkippedClaim("sub-claim 1"),
      nestedOutcome,
      new SkippedClaim("sub-claim 2")
    ]

    writeToReport(reporter, outcome)

    writer.expectLines([
      `# > ${expectedIdentifier}some-description`,
      `ok > ${expectedIdentifier}sub-claim 1 # SKIP`,
      `# > > ${expectedIdentifier}nested outcome`,
      `ok > > ${expectedIdentifier}nested claim 1 # SKIP`,
      `ok > > ${expectedIdentifier}nested claim 2 # SKIP`,
      `ok > ${expectedIdentifier}sub-claim 2 # SKIP`,
    ])
  })
}

skippedGroupedClaimBehavior("outcome", (reporter, claimResult) => {
  reporter.recordObservation(claimResult)
}, "")

skippedGroupedClaimBehavior("procedure", (reporter, claimResult) => {
  reporter.recordAction(claimResult)
}, "Perform: ")

skippedGroupedClaimBehavior("situation", (reporter, claimResult) => {
  reporter.recordPresupposition(claimResult)
}, "Suppose: ")


const invalidClaimBehavior = (name: string, writeToReport: (reporter: Reporter, claim: ClaimResult) => void, claimDescription: string, reportedDescription: string) => {
  test(`when an invalid ${name} is reported`, () => {
    const writer = new FakeReportWriter()
    const reporter = new TAPReporter(writer)

    writeToReport(reporter, new InvalidClaim(claimDescription, { expected: "something", actual: "nothing", operator: "equals", stack: "blah" }))

    writer.expectLines([
      `not ok ${reportedDescription}`,
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

    writeToReport(reporter, new InvalidClaim(claimDescription, {
      expected: "# Behavior: A Sample Behavior\n# Example: Comparing some numbers\n# tests 1\n# pass 1\n# fail 0\n# skip 0",
      actual: "# Behavior: A Sample Behavior\n# Example: Comparing some numbers",
      operator: "equals",
      stack: "blah"
    }))

    writer.expectLines([
      `not ok ${reportedDescription}`,
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

    writeToReport(reporter, new InvalidClaim(claimDescription, {
      expected: 7,
      actual: [9, 10, 11],
      operator: "equals",
      stack: "blah"
    }))

    writer.expectLines([
      `not ok ${reportedDescription}`,
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

    writeToReport(reporter, new InvalidClaim(claimDescription, error))

    writer.expectLines([
      `not ok ${reportedDescription}`,
      "  ---",
      "  stack: |-",
      "    funny stack",
      "  ..."
    ])
  })
}

invalidClaimBehavior("condition", (reporter, claimResult) => {
  reporter.recordPresupposition(claimResult)
}, "failed condition", "Suppose: failed condition")

invalidClaimBehavior("step", (reporter, claimResult) => {
  reporter.recordAction(claimResult)
}, "failed step", "Perform: failed step")

invalidClaimBehavior("observation", (reporter, claimResult) => {
  reporter.recordObservation(claimResult)
}, "failed observation", "failed observation")


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
    suppose: [
      fact<void>("failing condition", () => { throw error })
    ]
  }
}, "Suppose: failing condition")

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
    suppose: [
      fact("something throws an error", () => {
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


const invalidGroupedClaimBehavior = (name: string, writeToReport: (reporter: Reporter, claimResult: ClaimResult) => void, expectedIdentifier: string) => {
  test(`when an invalid ${name} is reported`, () => {
    const writer = new FakeReportWriter()
    const reporter = new TAPReporter(writer)

    const nestedOutcome = new InvalidClaim("nested outcome", {})
    nestedOutcome.subsumedResults = [
      new ValidClaim("nested claim 1"),
      new InvalidClaim("failing nested claim", { expected: "something", actual: "nothing", operator: "equals", stack: "blah" }),
      new SkippedClaim("skipped nested claim")
    ]

    const outcome = new InvalidClaim("some-description", {})
    outcome.subsumedResults = [
      new ValidClaim("sub-claim 1"),
      nestedOutcome,
      new SkippedClaim("sub-claim 2")
    ]

    writeToReport(reporter, outcome)

    writer.expectLines([
      `# > ${expectedIdentifier}some-description`,
      `ok > ${expectedIdentifier}sub-claim 1`,
      `# > > ${expectedIdentifier}nested outcome`,
      `ok > > ${expectedIdentifier}nested claim 1`,
      `not ok > > ${expectedIdentifier}failing nested claim`,
      "  ---",
      "  operator: equals",
      "  expected: \"something\"",
      "  actual:   \"nothing\"",
      "  stack: |-",
      "    blah",
      "  ...",
      `ok > > ${expectedIdentifier}skipped nested claim # SKIP`,
      `ok > ${expectedIdentifier}sub-claim 2 # SKIP`,
    ])
  })
}

invalidGroupedClaimBehavior("outcome", (reporter, claimResult) => {
  reporter.recordObservation(claimResult)
}, "")

invalidGroupedClaimBehavior("procedure", (reporter, claimResult) => {
  reporter.recordAction(claimResult)
}, "Perform: ")

invalidGroupedClaimBehavior("situation", (reporter, claimResult) => {
  reporter.recordPresupposition(claimResult)
}, "Suppose: ")


test.run()