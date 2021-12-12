## esbehavior

esbehavior is a framework for writing executable documentation.

Use esbehavior to describe the *behaviors* of your program.
Each behavior consists of one or more *examples* that together illustrate what
you want to describe. Each example can consist of some *conditions*, some *steps*, and
some *effects*. esbehavior runs each example and generates a report that indicates which
examples were valid and which were invalid.

### esbehavior sounds like a test framework. Why do we need another test framework?

esbehavior provides a domain specific language for writing executable documentation
that helps you structure your tests in a consistent way.

The hope is that this domain specific language results in documentation that is
easier to read and easier to update. It's also meant to be flexible, allowing
documentation authors to tailor and extend the DSL so that it is easy to describe
behaviors specific to their app.

esbehavior *encourages* documentation authors to model their examples in terms of small,
reusable functions, and to describe, with human readable phrases, each part of their
examples -- the conditions that must be true for it to run, the steps that are
performed, as well as the effects that should be observed.

In addition, esbehavior *discourages* some testing practices that tend to make test suites
more complicated: nested examples and shared state between examples.


### The DSL

Here's an example:

```
const appBehavior =
  behavior("the app shows things", [
    example({ init: () => new TestApp() })
      .description("a particular case")
      .script({
        prepare: [
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
- esbehavior can run in node or the browser
- esbehavior produces TAP output, so you can use any TAP reporter (tap-spec, tap-mocha-reporter, tap-difflet, etc)


## Running Behaviors

Once you have written some behaviors, pass them to the `validate` function to run them.
The idea here is that you will provide a 'runner' that collects your behaviors and
evaluates them using the `validate` function. This runner script could be executed
with node, or it could be executed in a browser context. `validate` will run each
example in sequence and print the results in TAP output to the console. Typically, you
will then pipe the output to a TAP reporter so that it's easy to read.

You can use `pick` to run selected examples or `skip` to ignore selected examples.

Here's a sample with [behaviors evaluated in node](./packages/node-sample) and here's
a sample for a React app with [behaviors evaluated in a browser](./packages/react-sample).
