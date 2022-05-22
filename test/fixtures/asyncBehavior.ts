import { expect } from "chai"
import { behavior, effect, example } from "../../src/index.js"

export let teardownValue = 0

export const asyncBehavior = behavior("a single test", [
  example({
    init: () => {
      return new Promise<number>(resolve => {
        setTimeout(() => resolve(7), 30)
      })
    },
    teardown: async (context) => {
      await new Promise<void>(resolve => {
        setTimeout(() => {
          teardownValue = context + 2
          resolve()
        }, 30)
      })
    }
  })
    .description("async context and observation")
    .script({
      observe: [
        effect("async compares the right numbers", async (actual) => {
          const fetchedValue = await new Promise(resolve => {
            setTimeout(() => resolve(actual + 5), 30)
          })
          try {
            expect(fetchedValue).to.equal(15)
          } catch (err: any) {
            throw {
              expected: err.expected,
              actual: err.actual,
              operator: err.operator,
              stack: "fake stack"
            }
          }
        }),
        effect("does something sync", (actual) => {
          expect(actual).to.equal(7)
        })
      ]
    })
])
