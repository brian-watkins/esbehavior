import { behavior, condition, effect, example, outcome, skip } from 'esbehavior'
import { div, mod, sum } from "../src/math.js"
import assert from 'proclaim'

export default
  behavior("math", [
    example()
      .description("sum")
      .script({
        observe: [
          effect("it is a function", () => {
            assert.isFunction(sum)
          }),
          outcome("addition works", [
            effect("it adds numbers", () => {
              assert.equal(sum(1, 2), 3)
            }),
            effect("it adds negative numbers", () => {
              assert.equal(sum(-1, -2), -3)
            }),
            effect("it sums to zero", () => {
              assert.equal(sum(-1, 1), 0)
            })  
          ])
        ]
      }),
    example()
      .description("divide")
      .script({
        observe: [
          effect("it is a function", () => {
            assert.isFunction(div)
          }),
          outcome("division works", [
            effect("it divides positive numbers", () => {
              assert.equal(div(1, 2), 0.5)
            }),
            effect("it divides negative numbers", () => {
              assert.equal(div(-1, -2), 0.5)
            }),
            effect("it divides by 1", () => {
              assert.equal(div(-1, 1), -1)
            })  
          ])
        ]
      }),
    example()
      .description("mod")
      .script({
        observe: [
          effect("it is a function", () => {
            assert.isFunction(mod)
          }),
          outcome("modular arithmetic works", [
            effect("it mods positive numbers", () => {
              assert.equal(mod(1, 2), 1)
            }),
            effect("it mods negative numbers", () => {
              assert.equal(mod(-3, -2), -1)
            }),
            effect("it mods other numbers", () => {
              assert.equal(mod(7, 4), 3)
            }),
          ]),
          effect("something fun happens", () => {})
        ]
      }),
    example()
      .description("complex math")
      .script({
        observe: [
          effect("it can add and substract", () => {
            assert.equal(sum(1, sum(-1, 3)), 3)
          }),
          outcome("it combines all three operations", [
            effect("this works", () => {
              assert.equal(14, 14)
            }),
            effect("hopefully it works", () => {
              assert.equal(sum(1, div(-1, 3)), 14)
            }),
            effect("something else that works", () => {
              assert.equal(1, 1)
            })
          ])
        ]
      })
  ])
