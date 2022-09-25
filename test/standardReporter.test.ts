import { test } from 'uvu'
import { FakeReportWriter } from './helpers/FakeReportWriter.js'
import { Formatter, StandardReporter } from '../src/StandardReporter.js'
import { behavior, fact, effect, example, skip, step, validate, Fact, Step, Effect } from '../src/index.js'
import { expect } from 'chai'
import { Failure, Reporter } from '../src/Reporter.js'
import { ClaimResult, InvalidClaim, SkippedClaim, ValidClaim } from '../src/Claim.js'
import { fakeTimer } from './helpers/FakeTimer.js'

test("multiple examples with valid and skipped claims", async () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({
    writer,
    formatter: new FakeFormatter(),
    timer: fakeTimer(13)
  })

  await validate([
    behavior("cool behavior", [
      example({ init: () => { return { number: 0 } } })
        .description("doing two things")
        .script({
          suppose: [
            new Fact("Do this first", (actual) => {
              actual.number = 6
            }, fakeTimer(1200))
          ],
          perform: [
            new Step("Add to the number", (actual) => {
              actual.number++
            }, fakeTimer(4))
          ],
          observe: [
            new Effect("it compares the correct number", (actual) => {
              expect(actual.number).to.equal(7)
            }, fakeTimer(600)),
            new Effect("it compares other numbers", (actual) => {
              expect(18).to.equal(18)
            }, fakeTimer(6)),
          ]
        }),
      skip.example()
        .description("skipped case")
        .script({
          suppose: [
            new Fact("some skipped condition", () => { }, fakeTimer(2))
          ],
          perform: [
            new Step("some skipped step", () => { }, fakeTimer(2))
          ],
          observe: [
            new Effect("it does not much", () => {
              expect(7).to.equal(7)
            }, fakeTimer(2))
          ]
        })
    ])
  ], { reporter })

  writer.expectLines([
    "cool behavior",
    "  doing two things",
    "  + Do this first (1.2s)",
    "  • Add to the number (4ms)",
    "  ✔ it compares the correct number (0.6s)",
    "  ✔ it compares other numbers (6ms)",
    "  skipped case",
    "  - some skipped condition",
    "  - some skipped step",
    "  - it does not much",
    "Summary",
    "1 behavior, 2 examples, 7 claims (13ms)",
    "- 3 skipped claims",
  ])
})

test("multiple behaviors, multiple examples, multiple claims", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: fakeTimer(8) })

  reporter.end({
    behaviors: 3, examples: 4, valid: 12, invalid: 0, skipped: 0
  })

  writer.expectLines([
    "Summary",
    "3 behaviors, 4 examples, 12 claims (8ms)",
    "✔ All claims are valid!"
  ])
})

test("multiple behaviors, multiple examples, multiple claims, one skipped", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: fakeTimer(8) })

  reporter.end({
    behaviors: 3, examples: 4, valid: 11, invalid: 0, skipped: 1
  })

  writer.expectLines([
    "Summary",
    "3 behaviors, 4 examples, 12 claims (8ms)",
    "- 1 skipped claim"
  ])
})

test("multiple behaviors, multiple examples, multiple claims, one invalid", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: fakeTimer(8) })

  reporter.end({
    behaviors: 3, examples: 4, valid: 11, invalid: 1, skipped: 0
  })

  writer.expectLines([
    "Summary",
    "3 behaviors, 4 examples, 12 claims (8ms)",
    "✖ 1 invalid claim"
  ])
})

test("multiple behaviors, multiple examples, multiple claims, multiple invalid", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: fakeTimer(8) })

  reporter.end({
    behaviors: 3, examples: 4, valid: 10, invalid: 2, skipped: 0
  })

  writer.expectLines([
    "Summary",
    "3 behaviors, 4 examples, 12 claims (8ms)",
    "✖ 2 invalid claims"
  ])
})

test("multiple behaviors, multiple examples, multiple claims, one invalid, one skipped", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: fakeTimer(8) })

  reporter.end({
    behaviors: 3, examples: 4, valid: 10, invalid: 1, skipped: 1
  })

  writer.expectLines([
    "Summary",
    "3 behaviors, 4 examples, 12 claims (8ms)",
    "✖ 1 invalid claim",
    "- 1 skipped claim"
  ])
})


test("one behavior, one example, one claim", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: fakeTimer(14) })

  reporter.end({
    behaviors: 1, examples: 1, valid: 1, invalid: 0, skipped: 0
  })

  writer.expectLines([
    "Summary",
    "1 behavior, 1 example, 1 claim (14ms)",
    "✔ All claims are valid!"
  ])
})

test("duration at 499", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: fakeTimer(499) })

  reporter.end({
    behaviors: 1, examples: 1, valid: 1, invalid: 0, skipped: 0
  })

  writer.expectLines([
    "Summary",
    "1 behavior, 1 example, 1 claim (499ms)",
    "✔ All claims are valid!"
  ])
})

test("duration at 500ms", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: fakeTimer(500) })

  reporter.end({
    behaviors: 1, examples: 1, valid: 1, invalid: 0, skipped: 0
  })

  writer.expectLines([
    "Summary",
    "1 behavior, 1 example, 1 claim (0.5s)",
    "✔ All claims are valid!"
  ])
})

test("duration above 1 second", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: fakeTimer(1765) })

  reporter.end({
    behaviors: 1, examples: 1, valid: 1, invalid: 0, skipped: 0
  })

  writer.expectLines([
    "Summary",
    "1 behavior, 1 example, 1 claim (1.77s)",
    "✔ All claims are valid!"
  ])
})

test("when the validation run is terminated", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

  const error = {
    message: "some failure",
    stack: "some stack trace\r\nat some.line.of.code\r\nat another.line.of.code"
  }

  reporter.terminate(error)

  writer.expectLines([
    "Failed to validate behaviors!",
    "  some failure",
    "  at some.line.of.code",
    "  at another.line.of.code"
  ])
})


const invalidClaimBehavior = (name: string, writeToReport: <T>(reporter: Reporter, scriptLocation: string, claimResult: ClaimResult) => void, description: string) => {
  test(`invalid ${name}`, () => {
    const writer = new FakeReportWriter()
    const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

    try {
      expect(7).to.be.lessThan(5)
    } catch (err: any) {
      err.stack = "some message\n   at some.line.of.code\n   at another.line.of.code"
      writeToReport(reporter, "file://some/file/location.ts:58:19", new InvalidClaim(description, err))

      writer.expectLines([
        `  ✖ ${description}`,
        "    expected 7 to be below 5",
        "    Actual",
        "      7",
        "    Expected",
        "      5",
        "    Script Failed",
        "      file://some/file/location.ts:58:19",
        "    at some.line.of.code",
        "    at another.line.of.code",
      ])
    }
  })

  test(`invalid ${name} with no actual and expected`, () => {
    const writer = new FakeReportWriter()
    const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

    const err = {
      message: "expected things to happen",
      stack: "some message\n   at some.line.of.code\n   at another.line.of.code"
    }
    writeToReport(reporter, "file://some/cool/location.ts:58:19", new InvalidClaim(description, err))

    writer.expectLines([
      `  ✖ ${description}`,
      "    expected things to happen",
      "    Script Failed",
      "      file://some/cool/location.ts:58:19",
      "    at some.line.of.code",
      "    at another.line.of.code"
    ])
  })

  test(`invalid ${name} with multi-line message`, () => {
    const writer = new FakeReportWriter()
    const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

    const err = {
      message: "expected things to happen\nmore information\r\neven more information.",
      stack: "some message\n   at some.line.of.code\n   at another.line.of.code"
    }
    writeToReport(reporter, "file://some/awesome/location.ts:58:19", new InvalidClaim(description, err))

    writer.expectLines([
      `  ✖ ${description}`,
      "    expected things to happen",
      "    more information",
      "    even more information.",
      "    Script Failed",
      "      file://some/awesome/location.ts:58:19",
      "    at some.line.of.code",
      "    at another.line.of.code"
    ])
  })

  test(`invalid ${name} with no expected`, () => {
    const writer = new FakeReportWriter()
    const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

    try {
      expect(["one", "two", "three"]).to.contain("apples")
    } catch (err: any) {
      err.stack = "some message\n   at some.line.of.code\n   at another.line.of.code"
      writeToReport(reporter, "file://some/file/location.ts:58:19", new InvalidClaim(description, err))

      writer.expectLines([
        `  ✖ ${description}`,
        "    expected [ 'one', 'two', 'three' ] to include 'apples'",
        "    Script Failed",
        "      file://some/file/location.ts:58:19",
        "    at some.line.of.code",
        "    at another.line.of.code"
      ])
    }
  })

  test(`invalid ${name} with falsey expected`, () => {
    const writer = new FakeReportWriter()
    const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

    try {
      expect(false).to.be.true
    } catch (err: any) {
      err.stack = "some message\n   at some.line.of.code\n   at another.line.of.code"
      writeToReport(reporter, "file://some/file/location.ts:58:19", new InvalidClaim(description, err))

      writer.expectLines([
        `  ✖ ${description}`,
        "    expected false to be true",
        "    Actual",
        "      false",
        "    Expected",
        "      true",
        "    Script Failed",
        "      file://some/file/location.ts:58:19",
        "    at some.line.of.code",
        "    at another.line.of.code"
      ])
    }
  })

  test(`invalid ${name} with falsey actual`, () => {
    const writer = new FakeReportWriter()
    const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

    try {
      expect(true).to.be.false
    } catch (err: any) {
      err.stack = "some message\n   at some.line.of.code\n   at another.line.of.code"
      writeToReport(reporter, "file://some/file/location.ts:58:19", new InvalidClaim(description, err))

      writer.expectLines([
        `  ✖ ${description}`,
        "    expected true to be false",
        "    Actual",
        "      true",
        "    Expected",
        "      false",
        "    Script Failed",
        "      file://some/file/location.ts:58:19",
        "    at some.line.of.code",
        "    at another.line.of.code"
      ])
    }
  })

  test(`invalid ${name} with duration less than 500ms`, () => {
    const writer = new FakeReportWriter()
    const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

    try {
      expect(true).to.be.false
    } catch (err: any) {
      err.stack = "some message\n   at some.line.of.code\n   at another.line.of.code"
      const claim = new InvalidClaim(description, err)
      claim.duration = 323
      writeToReport(reporter, "file://some/file/location.ts:58:19", claim)

      writer.expectLines([
        `  ✖ ${description} (323ms)`,
        "    expected true to be false",
        "    Actual",
        "      true",
        "    Expected",
        "      false",
        "    Script Failed",
        "      file://some/file/location.ts:58:19",
        "    at some.line.of.code",
        "    at another.line.of.code"
      ])
    }
  })

  test(`invalid ${name} with duration greater than 500ms`, () => {
    const writer = new FakeReportWriter()
    const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

    try {
      expect(true).to.be.false
    } catch (err: any) {
      err.stack = "some message\n   at some.line.of.code\n   at another.line.of.code"
      const claim = new InvalidClaim(description, err)
      claim.duration = 1243
      writeToReport(reporter, "file://some/file/location.ts:58:19", claim)

      writer.expectLines([
        `  ✖ ${description} (1.24s)`,
        "    expected true to be false",
        "    Actual",
        "      true",
        "    Expected",
        "      false",
        "    Script Failed",
        "      file://some/file/location.ts:58:19",
        "    at some.line.of.code",
        "    at another.line.of.code"
      ])
    }
  })
}

invalidClaimBehavior("condition", (reporter, scriptLocation, claimResult) => {
  reporter.startScript(scriptLocation)
  reporter.recordPresupposition(claimResult)
  reporter.endScript()
}, "some condition")

invalidClaimBehavior("step", (reporter, scriptLocation, claimResult) => {
  reporter.startScript(scriptLocation)
  reporter.recordAction(claimResult)
  reporter.endScript()
}, "some step")

invalidClaimBehavior("observation", (reporter, scriptLocation, claimResult) => {
  reporter.startScript(scriptLocation)
  reporter.recordObservation(claimResult)
  reporter.endScript()
}, "some observation")

const validTestClaim = (description: string, duration: number) => {
  const claim = new ValidClaim(description)
  claim.duration = duration
  return claim
}

const invalidTestClaim = (description: string, failure: Failure, duration: number) => {
  const claim = new InvalidClaim(description, failure)
  claim.duration = duration
  return claim
}

const validGroupedClaimBehavior = (name: string, writeToReport: (reporter: Reporter, claimResult: ClaimResult) => void, expectedIdentifier: string) => {
  test(`when a valid ${name} is reported`, () => {
    const writer = new FakeReportWriter()
    const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

    const nestedOutcome = new ValidClaim("nested grouped claim")
    nestedOutcome.subsumedResults = [
      validTestClaim("nested claim 1", 20),
      validTestClaim("nested claim 2", 200)
    ]

    const outcome = new ValidClaim("some grouped claim")
    outcome.subsumedResults = [
      validTestClaim("sub-claim 1", 40),
      nestedOutcome,
      validTestClaim("sub-claim 2", 600)
    ]

    writeToReport(reporter, outcome)

    writer.expectLines([
      `  ${expectedIdentifier} some grouped claim`,
      `    ➜ sub-claim 1 (40ms)`,
      `    ➜ nested grouped claim`,
      `      ➜ nested claim 1 (20ms)`,
      `      ➜ nested claim 2 (200ms)`,
      `    ➜ sub-claim 2 (0.6s)`
    ])
  })
}

validGroupedClaimBehavior("outcome", (reporter, claimResult) => {
  reporter.startScript("some-location")
  reporter.recordObservation(claimResult)
  reporter.endScript()
}, "✔")

validGroupedClaimBehavior("procedure", (reporter, claimResult) => {
  reporter.startScript("some-location")
  reporter.recordAction(claimResult)
  reporter.endScript()
}, "•")

validGroupedClaimBehavior("situation", (reporter, claimResult) => {
  reporter.startScript("some-location")
  reporter.recordPresupposition(claimResult)
  reporter.endScript()
}, "+")


const skippedGroupedClaimBehavior = (name: string, writeToReport: (reporter: Reporter, claimResult: ClaimResult) => void) => {
  test(`when a skipped ${name} is reported`, () => {
    const writer = new FakeReportWriter()
    const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

    const nestedOutcome = new SkippedClaim("nested grouped claim")
    nestedOutcome.subsumedResults = [
      new SkippedClaim("nested claim 1"),
      new SkippedClaim("nested claim 2")
    ]

    const outcome = new SkippedClaim("some grouped claim")
    outcome.subsumedResults = [
      new SkippedClaim("sub-claim 1"),
      nestedOutcome,
      new SkippedClaim("sub-claim 2")
    ]

    writeToReport(reporter, outcome)

    writer.expectLines([
      `  - some grouped claim`,
      `    ➜ sub-claim 1`,
      `    ➜ nested grouped claim`,
      `      ➜ nested claim 1`,
      `      ➜ nested claim 2`,
      `    ➜ sub-claim 2`,
    ])
  })
}

skippedGroupedClaimBehavior("outcome", (reporter, claimResult) => {
  reporter.startScript("some-location")
  reporter.recordObservation(claimResult)
  reporter.endScript()
})

skippedGroupedClaimBehavior("procedure", (reporter, claimResult) => {
  reporter.startScript("some-location")
  reporter.recordAction(claimResult)
  reporter.endScript()
})

skippedGroupedClaimBehavior("situation", (reporter, claimResult) => {
  reporter.startScript("some-location")
  reporter.recordPresupposition(claimResult)
  reporter.endScript()
})


const invalidGroupedClaimBehavior = (name: string, writeToReport: (reporter: Reporter, scriptLocation: string, claimResult: ClaimResult) => void) => {
  test(`when an invalid ${name} is reported`, () => {
    const writer = new FakeReportWriter()
    const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

    const nestedOutcome = new InvalidClaim("nested grouped claim", {})
    nestedOutcome.subsumedResults = [
      validTestClaim("nested claim 1", 30),
      invalidTestClaim("failing nested claim", { message: "some message", expected: "something", actual: "nothing", operator: "equals", stack: "some message\n   at some.line.of.code\n   at another.line.of.code" }, 35),
      new SkippedClaim("skipped nested claim")
    ]

    const outcome = new InvalidClaim("grouped claim", {})
    outcome.subsumedResults = [
      validTestClaim("sub-claim 1", 400),
      nestedOutcome,
      new SkippedClaim("sub-claim 2")
    ]

    writeToReport(reporter, "some-location", outcome)

    writer.expectLines([
      `  ✖ grouped claim`,
      `    ➜ sub-claim 1 (400ms)`,
      `    ✖ nested grouped claim`,
      `      ➜ nested claim 1 (30ms)`,
      `      ✖ failing nested claim (35ms)`,
      "        some message",
      "        Actual",
      "          nothing",
      "        Expected",
      "          something",
      "        Script Failed",
      "          some-location",
      "        at some.line.of.code",
      "        at another.line.of.code",
      `      ➜ skipped nested claim`,
      `    ➜ sub-claim 2`,
    ])
  })
}

invalidGroupedClaimBehavior("outcome", (reporter, scriptLocation, claimResult) => {
  reporter.startScript(scriptLocation)
  reporter.recordObservation(claimResult)
  reporter.endScript()
})

invalidGroupedClaimBehavior("procedure", (reporter, scriptLocation, claimResult) => {
  reporter.startScript(scriptLocation)
  reporter.recordAction(claimResult)
  reporter.endScript()
})

invalidGroupedClaimBehavior("situation", (reporter, scriptLocation, claimResult) => {
  reporter.startScript(scriptLocation)
  reporter.recordPresupposition(claimResult)
  reporter.endScript()
})


test.run()


class FakeFormatter implements Formatter {
  underline(message: string): string {
    return message
  }
  bold(message: string): string {
    return message
  }
  dim(message: string): string {
    return message
  }
  red(message: string): string {
    return message
  }
  yellow(message: string): string {
    return message
  }
  green(message: string): string {
    return message
  }
  cyan(message: string): string {
    return message
  }
}
