# esbehavior

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
examples -- the presuppositions that must be true for it to run, the actions that are
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
        suppose: [
          fact("there are things", (app) => app.setThings(["a", "b", "c"]))
          fact("the app is loaded", (app) => app.start())
        ],
        perform: [
          step("the user clicks", (app) => app.doClick())
        ],
        observe: [
          effect("things are shown", (app) => {
            expect(app.display.things).to.equal(["a", "b", "c"])
          })
        ]
      })
  ])

validate([appBehavior])
```

Each behavior is made up of one or more examples. Each example has an optional
context, an optional description, and a script.

The context is initialized at the start of an example and passed to each function in the script.
Use the context to store any state for this exmple. A teardown function can be provided,
which will run at the end of the example.

The script is a sequence of `Claims`; each claim has a description and a function that
takes the context as an argument and returns `void` or `Promise<void>`. esbehavior will
wait for any returned promise to resolve before evaluating the next claim.

There are three types of claims: `Presuppositions`, `Actions`, and `Observations`. esbehavior
exposes `fact`, `step`, and `effect` functions to generate these types of claims. You can group
these for more complex claims using `situation`, `procedure`, and `outcome`, respectively.

A script is organized into three parts, each of which is optional. `suppose` specifies
one or more `Presuppositions` that should be validated first, `perform` specifies
one or more `Actions` that are executed as part of the example, and
`observe` specifies one or more `Observations` that should be true as
a result of performing the steps. Use `andThen` to chain multiple scripts as
part of one example.

If any exception is thrown when executing a `Presupposition`
or a `Action`, then the example is considered invalid, an error will be reported, and
the remainder of the script will be skipped. By contrast, an attempt will be made to
check each `Observation`, no matter if doing so results in an exception. So, a single
example can have multiple invalid observations.

Generally speaking, `Observation` functions make assertions about the state of things,
but you can include assertions in conditions and steps, as well, if it makes
sense to do so.

Use any assertion library you like (chai, power assert, proclaim, node assert, etc).

esbehavior can run in node or the browser.

esbehavior works well with Typescript; type hints should (hopefully) provide some
documentation of the dsl.

For more examples, see the [tests](https://github.com/brian-watkins/esbehavior/tree/main/test).


## Running Behaviors

esbehavior is a DSL that helps you write programs that document the behavior of
your software. In order to execute the examples, you will need to write a 'runner'
script that gathers the appropriate behaviors and passes them to the `validate` function,
which will run all the examples for each behavior and print the results to the console. 

This 'runner' script could be executed with node, or it could be executed in a
browser context.

You can use run selected examples like so:

```
behavior("my behavior", [
  (m) => m.pick() && example()
    .script({ ... })
])
```

You can also skip selected examples like so:

```
behavior("my behavior", [
  (m) => m.skip() && example()
    .script({ ... })
])
```

Here's a sample with [behaviors evaluated in node](https://github.com/brian-watkins/esbehavior/tree/main/samples/node) and here's
a sample for a React app with [behaviors evaluated in a browser](https://github.com/brian-watkins/esbehavior/tree/main/samples/react).


## Public API

### validate(behaviors: Array<Behavior>, options: ValidationOptions): Promise<Summary> 

This function validates a list of behaviors and returns a summary. Use the DSL functions
to create `Behaviors`.

### ValidationOptions

The `ValidationOptions` are:

```
{
  reporter?: Reporter, // By default this is StandardReporter
  failFast?: boolean, // By default this is false
  order?: OrderProvider, // By default this is a random order with a generated seed
}
```

#### reporter

You can use the `reporter` option to pass in a `Reporter` to use during validation. There
are two options at the moment:

1. `StandardReporter` -- This reporter will be used by default if none is specified. It
prints nicely formatted output to the console. By default, it will print the duration of
any claims that take longer than 100ms. This value can be changed by providing your
own instance of `StandardReporter` -- with the `slowClaim` option set to whatever you want --
to the `validate` function.
2. `TAPReporter` -- This reporter prints TAP formatted output to the console. Use this to tie
into the larger ecosystem of tools that use TAP, which includes other reporters (tap-spec,
tap-mocha-reporter, tap-difflet, etc) as well as other tools.

You could also provide your own implementation of the `Reporter` interface.

#### failFast

If this option is set then the validation run will stop after the first invalid claim.
The remainder of the current example and remaining examples will be skipped. No more output
will be generated, but the summary will contain the total number of claims skipped.

#### order

Use this option to specify how behaviors, examples, and observations should be ordered. Other
elements of examples -- like presuppositions, actions, and scripts -- will be run in their
given order since these may depend on being run in a particular order. Behaviors, examples, and
observations *should not* depend on being run in any particular order, and so by default
esbehavior will run these in a random order. Hopefully this will help to identify any shared
state or other hidden dependencies among examples.

If you need to reproduce the ordering of a validation run, note the seed that is printed out by the
standard reporter and use that to configure the random order to use that seed like so:

```
validate(myBehaviors, {
  order: randomOrder(seed)
})
```

You can also use the `defaultOrder()` function to generate an OrderProvider that runs Behaviors,
Examples, and Observations in the order given by the test suite files.

If none of these options is suitable, you can provide your own implementation of `OrderProvider`.