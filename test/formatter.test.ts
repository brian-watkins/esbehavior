import { test } from "uvu";
import { ANSIFormatter } from "../src/reporter/formatter";
import * as assert from 'uvu/assert'

test("when NO_COLOR environment variable is not set", () => {
  const formatter = new ANSIFormatter()
  const formattedText = formatter.underline(formatter.red("Hey!"))
  assert.equal(formattedText, "\x1b[4m\x1b[31mHey!\x1b[39m\x1b[24m")
})

test("when NO_COLOR environment variable is set and not empty", () => {
  process.env["NO_COLOR"] = "1"
  const formatter = new ANSIFormatter()
  const formattedText = formatter.underline(formatter.red("Hey!"))
  delete process.env["NO_COLOR"]
  assert.equal(formattedText, "Hey!")
})

test("when NO_COLOR environment variable is set and empty", () => {
  process.env["NO_COLOR"] = ""
  const formatter = new ANSIFormatter()
  const formattedText = formatter.underline(formatter.red("Hey!"))
  delete process.env["NO_COLOR"]
  assert.equal(formattedText, "\x1b[4m\x1b[31mHey!\x1b[39m\x1b[24m")
})

test.run()