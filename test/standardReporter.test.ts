import { test } from 'uvu'
import { FakeReportWriter } from './helpers/FakeReportWriter.js'
import { Formatter, StandardReporter } from '../src/StandardReporter.js'
import { behavior, condition, effect, example, skip, step, validate } from '../src/index.js'
import { expect } from 'chai'
import { Reporter } from '../src/Reporter.js'
import { ClaimResult, InvalidClaim, SkippedClaim, ValidClaim } from '../src/Claim.js'
import { FakeTimer } from './helpers/FakeTimer.js'

test("multiple examples with valid and skipped claims", async () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({
    writer,
    formatter: new FakeFormatter(),
    timer: new FakeTimer(13)
  })

  await validate([
    behavior("cool behavior", [
      example({ init: () => { return { number: 0 } } })
        .description("doing two things")
        .script({
          prepare: [
            condition("Do this first", (actual) => {
              actual.number = 6
            })
          ],
          perform: [
            step("Add to the number", (actual) => {
              actual.number++
            })
          ],
          observe: [
            effect("it compares the correct number", (actual) => {
              expect(actual.number).to.equal(7)
            }),
            effect("it compares other numbers", (actual) => {
              expect(18).to.equal(18)
            }),
          ]
        }),
      skip.example()
        .description("skipped case")
        .script({
          prepare: [
            condition("some skipped condition", () => { })
          ],
          perform: [
            step("some skipped step", () => { })
          ],
          observe: [
            effect("it does not much", () => {
              expect(7).to.equal(7)
            })
          ]
        })
    ])
  ], { reporter })

  writer.expectLines([
    "cool behavior",
    "  doing two things",
    "  + Do this first",
    "  • Add to the number",
    "  ✔ it compares the correct number",
    "  ✔ it compares other numbers",
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
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: new FakeTimer(8) })

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
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: new FakeTimer(8) })

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
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: new FakeTimer(8) })

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
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: new FakeTimer(8) })

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
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: new FakeTimer(8) })

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
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: new FakeTimer(14) })

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
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: new FakeTimer(499) })

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
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: new FakeTimer(500) })

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
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter(), timer: new FakeTimer(1765) })

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


const invalidClaimBehavior = (name: string, writeToReport: <T>(reporter: Reporter, claimResult: ClaimResult) => void, description: string) => {
  test(`invalid ${name}`, () => {
    const writer = new FakeReportWriter()
    const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

    try {
      expect(7).to.be.lessThan(5)
    } catch (err: any) {
      err.stack = "some message\n   at some.line.of.code\n   at another.line.of.code"
      writeToReport(reporter, new InvalidClaim(description, "file://some/file/location.ts:58:19", err))

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
    writeToReport(reporter, new InvalidClaim(description, "file://some/cool/location.ts:58:19", err))

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
    writeToReport(reporter, new InvalidClaim(description, "file://some/awesome/location.ts:58:19", err))

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
      writeToReport(reporter, new InvalidClaim(description, "file://some/file/location.ts:58:19", err))

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
      writeToReport(reporter, new InvalidClaim(description, "file://some/file/location.ts:58:19", err))

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
      writeToReport(reporter, new InvalidClaim(description, "file://some/file/location.ts:58:19", err))

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
}

invalidClaimBehavior("condition", (reporter, claimResult) => {
  reporter.recordPreparation(claimResult)
}, "some condition")

invalidClaimBehavior("step", (reporter, claimResult) => {
  reporter.recordPerformance(claimResult)
}, "some step")

invalidClaimBehavior("observation", (reporter, claimResult) => {
  reporter.recordObservation(claimResult)
}, "some observation")

test("valid outcome", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

  const effect = new ValidClaim("some funny valid outcome", "some-location")
  effect.subsumedResults = [
    new ValidClaim("Valid Claim 1", "at-some-location"),
    new ValidClaim("Valid Claim 2", "at-some-location"),
    new ValidClaim("Valid Claim 3", "at-some-location"),
  ]

  reporter.recordObservation(effect)

  writer.expectLines([
    "  ✔ some funny valid outcome",
    "    ✔ Valid Claim 1",
    "    ✔ Valid Claim 2",
    "    ✔ Valid Claim 3",
  ])
})

test("valid nested outcome", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

  const nestedOutcome = new ValidClaim("Valid Nested Outcome", "at-some-location")
  nestedOutcome.subsumedResults = [
    new ValidClaim("Valid Nested Claim 1", "at-some-location"),
    new ValidClaim("Valid Nested Claim 2", "at-some-location"),
  ]

  const effect = new ValidClaim("some funny valid outcome", "some-location")
  effect.subsumedResults = [
    new ValidClaim("Valid Claim 1", "at-some-location"),
    nestedOutcome,
    new ValidClaim("Valid Claim 3", "at-some-location"),
  ]

  reporter.recordObservation(effect)

  writer.expectLines([
    "  ✔ some funny valid outcome",
    "    ✔ Valid Claim 1",
    "    ✔ Valid Nested Outcome",
    "      ✔ Valid Nested Claim 1",
    "      ✔ Valid Nested Claim 2",
    "    ✔ Valid Claim 3",
  ])
})

test("invalid outcome", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

  try {
    expect(7).to.be.lessThan(5)
  } catch (err: any) {
    err.stack = "some message\n   at some.line.of.code\n   at another.line.of.code"

    const effect = new InvalidClaim("bad outcome", "some-location", {})
    effect.subsumedResults = [
      new ValidClaim("some claim that worked", "at-some-location"),
      new InvalidClaim("some failing claim", "at-some-location", err)
    ]

    reporter.recordObservation(effect)

    writer.expectLines([
      "  ✖ bad outcome",
      "    ✔ some claim that worked",
      "    ✖ some failing claim",
      "      expected 7 to be below 5",
      "      Actual",
      "        7",
      "      Expected",
      "        5",
      "      Script Failed",
      "        at-some-location",
      "      at some.line.of.code",
      "      at another.line.of.code",
    ])
  }
})

test("nested invalid outcome", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

  try {
    expect(7).to.be.lessThan(5)
  } catch (err: any) {
    err.stack = "some message\n   at some.line.of.code\n   at another.line.of.code"

    const nestedOutcome = new InvalidClaim("bad nested outcome", "some-location", {})
    nestedOutcome.subsumedResults = [
      new ValidClaim("some claim that worked 2", "at-some-location"),
      new InvalidClaim("some failing claim", "at-some-location", err)
    ]

    const effect = new InvalidClaim("bad outcome", "some-location", {})
    effect.subsumedResults = [
      new ValidClaim("some claim that worked 1", "at-some-location"),
      nestedOutcome,
      new ValidClaim("Another claim that worked", "at-some-location")
    ]

    reporter.recordObservation(effect)

    writer.expectLines([
      "  ✖ bad outcome",
      "    ✔ some claim that worked 1",
      "    ✖ bad nested outcome",
      "      ✔ some claim that worked 2",
      "      ✖ some failing claim",
      "        expected 7 to be below 5",
      "        Actual",
      "          7",
      "        Expected",
      "          5",
      "        Script Failed",
      "          at-some-location",
      "        at some.line.of.code",
      "        at another.line.of.code",
      "    ✔ Another claim that worked",
    ])
  }
})

test("skipped nested outcome", () => {
  const writer = new FakeReportWriter()
  const reporter = new StandardReporter({ writer, formatter: new FakeFormatter() })

  const nestedOutcome = new SkippedClaim("Skipped Nested Outcome", "at-some-location")
  nestedOutcome.subsumedResults = [
    new SkippedClaim("Skipped Nested Claim 1", "at-some-location"),
    new SkippedClaim("Skipped Nested Claim 2", "at-some-location"),
  ]

  const effect = new SkippedClaim("some funny skipped outcome", "some-location")
  effect.subsumedResults = [
    new SkippedClaim("Skipped Claim 1", "at-some-location"),
    nestedOutcome,
    new SkippedClaim("Skipped Claim 3", "at-some-location"),
  ]

  reporter.recordObservation(effect)

  writer.expectLines([
    "  - some funny skipped outcome",
    "    - Skipped Claim 1",
    "    - Skipped Nested Outcome",
    "      - Skipped Nested Claim 1",
    "      - Skipped Nested Claim 2",
    "    - Skipped Claim 3",
  ])
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
  line(length: number): string {
    return ""
  }
}
