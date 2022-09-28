import { test } from "uvu";
import * as assert from "uvu/assert"
import { SeededRandomizer } from "../src/OrderProvider.js";

test("random ordering", () => {
  const list = ["a", "b", "c", "d", "e"]

  const randomizer = new SeededRandomizer()
  const randomList = randomizer.order(list)

  assert.not.equal(list, randomList)
})

test("seeded randomizer returns same order", () => {
  const list = ["a", "b", "c", "d", "e"]

  const randomizer = new SeededRandomizer()
  const randomList = randomizer.order(list)

  const anotherRandomizer = new SeededRandomizer(randomizer.seed)
  const anotherRandomList = anotherRandomizer.order(list)

  assert.equal(randomList, anotherRandomList)
})

test("seeded randomizer description contains the generated seed", () => {
  const randomizer = new SeededRandomizer()

  assert.ok(randomizer.seed.length > 0)
  assert.ok(randomizer.description.includes(randomizer.seed))
})

test.run()