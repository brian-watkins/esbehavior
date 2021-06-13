## Behavior Documentation and Verification Program (BDVP)

BDVP is a framework for producing documentation that works. 

Use BDVP to describe the *behaviors* of your program.
Each behavior consists of one or more *examples* that together illustrate what
you want to describe. Each example consists of some *conditions* and
some *effects*. BDVP runs each example and generates a report that indicates which
examples were valid and which were invalid.

### BDVP sounds like a test framework. Why do we need another test framework?

BDVP is not simply a test framework. It provides a domain specific language that encourages
better documentation practices. It generates reports that could (and should!) be read
by anyone interested in understanding the expected behaviors of the program.

### The DSL

Here's an example:

```
const appBehavior =
  behavior("the app shows things", [
    example({ subject: () => new TestApp() })
      .description("a particular case")
      .script({
        assume: [
          condition("the app loads", (app) => await app.start())
        ],
        observe: [
          effect("things are shown", (app) => {
            expect(app.display.things).to.equal(expectedThings)
          })
        ]
      })
  ])

validate([appBehavior])
```

Some notes:
- Use any assertion library you like (chai, power assert, proclaim, node assert, etc)
- BDVP can run in node or the browser
- BDVP produces TAP output, so you can use any TAP reporter (tap-spec, tap-mocha-reporter, tap-difflet, etc)


#### To run the sample

```
$ npm sample
```

### Tests

To run the tests:

```
$ npm test
```