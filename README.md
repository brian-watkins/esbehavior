# esbehavior

esbehavior is a framework for writing executable documentation. It works best
with Typescript.

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

### Getting Started

```
$ npm install --save-dev esbehavior
```

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

Use any assertion library you like ([great-expectations](https://www.npmjs.com/package/great-expectations), chai, power assert, proclaim, node assert, etc).

esbehavior can run in node or the browser.

esbehavior works well with Typescript; type hints should (hopefully) provide some
documentation of the dsl.

For more examples, see the [tests](https://github.com/brian-watkins/esbehavior/tree/main/test).


## Running Behaviors

esbehavior is just a framework for writing executable documentation in terms of
behaviors and examples. In order to validate the behaviors you write, you'll need to
write a 'runner' script that gathers the appropriate behaviors and passes them to
the `validate` function, which will then run all the examples for each behavior and print
the results to the console.

This 'runner' script could be executed with node, or it could be executed in a
browser context.

Here's a sample with [behaviors evaluated in node](https://github.com/brian-watkins/esbehavior/tree/main/samples/node) -- note the runner file at `esbehavior/samples/node/specs/runner.ts` -- and here's
a sample for a React app with [behaviors evaluated in a browser](https://github.com/brian-watkins/esbehavior/tree/main/samples/react) -- with the runner file at `esbehavior/samples/react/specs/runner.mjs`.


### Running particular examples only; Skipping examples

You can use run particular examples only like so:

```
behavior("my behavior", [
  (m) => m.pick() && example()
    .script({ ... })
])
```

You can also skip particular examples like so:

```
behavior("my behavior", [
  (m) => m.skip() && example()
    .script({ ... })
])
```


### Running particular behaviors only; Skipping Behaviors

You can run particular behaviors like so:

```
(m) => m.pick() && behavior("my behavior", [
  example()
    .script({ ... })
])
```

This will run only those examples belonging to the picked behaviors, except those that
are explicitly skipped.

You can skip a behavior like so:

```
(m) => m.skip() && behavior("my behavior", [
  example()
    .script({ ... })
])
```

This will skip *all* examples belonging to the skipped behaviors, even those that are
explicitly picked.


### Source Map Support

Depending on how your behaviors are transpiled or where they are validated (in node or the
browser) you may find that you need to install support for source maps so that stack traces
provide the correct line numbers.

If you run esbehavior with typescript in node, then [ts-node](https://www.npmjs.com/package/ts-node)
has built in support for source maps.

If you run esbehavior in the browser, check out
[source-map-support](https://www.npmjs.com/package/source-map-support).


## Public API

### Creating a Behavior

#### behavior(description: string, examples: ConfigurableExample[]): Behavior

This function generates a behavior with some description and some list of examples. A
`Behavior` is just data -- a description and an array of `ConfigurableExample`; this
function is for convenience.

A `ConfigurableExample` is an `Example` or a function that takes `ExampleOptions`
and returns an `Example`.

An `ExampleOptions` is an object that exposes `pick` and `skip` methods, which support
validating a particular example only or ignoring it, respectively.

In practice, this looks like:

```
behavior("my behavior", [
  example()
    .description("example one")
    .script({ ... }),
  (m) => m.pick() && example()
    .description("example two")
    .script({ ... })
])
```

which will only validate `anotherExample`. We suggest following the format here
(ie, using the `&&` to have the function return the generated `Example`) to
avoid the need for braces around the example definition or reference with picking
or skipping it.


### Creating an Example

An Example is just an object that implements the following interface:

```
interface Example {
  validate(reporter: Reporter, options: ExampleValidationOptions): Promise<Summary>
  skip(reporter: Reporter, options: ExampleValidationOptions): Promise<Summary>
}
```

esbehavior provides a default implementation of `Example` that should serve well
for most use cases. According to the default implementation, an `Example` is
composed of a script and an optional description. A `Script` describes
the flow of the example. First, you may need to *suppose* that
certain things are true. Next, you may need to *perform* certain actions. Finally, you
will need to *observe* that certain things are the case. A `Script` is just an object
that organizes all these claims.

In addition to the `Script`, an example may specify a `Context`. The Context is an
object with an `init` function that generates a value that will be passed to each
claim in the script. The `Context` is initialized at the start of the example, and
cleaned up at the end, via an optional `teardown` function (no matter whether any
claims fail in the meantime). Use a Context value to store any state that the example
might need. For example, the context might just be a holder that stores values computed
during one part of the script and observed later. Or, the context might initialize a browser
context, provide a reference to it throughout the script, and then destroy it at the end.


#### Context

A context is an object that conforms to this interface:

```
interface Context<T> {
  init: () => T | Promise<T>
  teardown?: (context: T) => void | Promise<void>
}
```

The `init` method is called at the start of the example, and the generated value
is passed to each claim that's part of the script. No matter what happens during the
script, if the `teardown` method is defined, it will be called at the end of the
example. If the `init` method or the `teardown` method fails, then the validation
run will be terminated.

#### use\<T, S\>(context: Context\<T\>, dependentContext: Context\<S, T\>): Context\<S\>

Use this function to provide a Context as a dependency to another Context. Suppose you
have an example that uses a `testableApp` context which itself needs to use a web browser
supplied with a context generated using a function called `browserContext()`. You could
set that up like so:

```
const testableApp: Context<TestableApp> = use(browserContext(), {
  init(browser) => new TestApp(browser)
})
```

#### contextMap\<D extends Record\<string, Context\<any\>\>\>(map?: D): ContextMap\<ContextValues\<D\>\>

Sometimes an example might make use of several services. It might need a
reference to a browser page to load the application under test inside, and it
might need a reference to a database to set up things for the test, and
it might even need to start and stop a web service. Each of these services --
the browser, the database, the web service -- can be managed through their
own Context, with service-specific initialization and teardown functions. So
you might have a function called `browserContext(config)` that
builds a context to initialize and teardown a browser page based on some
config. Or `serverContext(config)` that starts and stops a web service based
on some config. When working with multiple contexts, provide them to an
example via a `ContextMap`.

A `ContextMap` is itself a Context that provides an object with keys that each
map to a value of some other Context. The `ContextMap` will manage initializing
and tearing down each of the included contexts in the right order.

Use the `contextMap` function to build a `ContextMap` from other contexts. And
note that `ContextMap` has a method called `set` which creates a new `ContextMap`
with a new context, based on the existing values in the `ContextMap`.

For example, we can create a `ContextMap` with the contexts described above like
so:

```
const appContext = contextMap({ database: databaseContext() })
  .set("server", ({ database }) => serverContext(database.connectionString))
  .set("browser", ({ server }) => browserContext(server.host))
```

In this example, `appContext` is a `Context<{ database: Database, server: WebService, browser: BrowserPage }>`
where `Database`, `WebService`, and `BrowserPage` are the values of the respective contexts.

This context can then be used to build an example-specific context like so:

```
const exampleContext = use(appContext, {
  init({ browser }) => new TestApp(browser)
})
```

#### Example

An example is just an object that conforms to the `Example` interface defined
above. esbehavior includes a default implementation of `Example` that should
serve well for most purposes; it is available via the `example` function.

#### example\<T\>(context?: Context\<T\>): Fluent Example builder API

Use this function to start the construction of an example. Provide a context, if
necessary. This function results in an object that progressively exposes the
API for building an Example. If you use Typescript, the auto-completion in your editor
should help you understand the options; look in the source for details about the types.
In general, example creation will follow this pattern:

```
example(someContext)
  .description("my description") // optional
  .script({
    suppose: [ ... ], // presuppositions
    perform: [ ... ], // actions
    observe: [ ... ], // observations
  })
  .andThen({
    // another script if necessary
  })
```

This will result in an `Example` that can then be passed to the `behavior`
function defined above.

None of the method calls here are necessary, but if you want the resulting example to
actually be validated, you must provide at least one script.

Use the `andThen` method to add another script to an example. This is useful for
more complicated examples that might involve observations at multiple stages.

### Creating a Script

A script is an object that conforms to this interface:

```
interface Script<T> {
  suppose?: Array<Presupposition<T>>
  perform?: Array<Action<T>>
  observe?: Array<Observation<T>>
}
```

#### fact\<T\>(description: string, validate: (context: T) => void | Promise\<void\>): Presupposition\<T\>

Create a presupposition for the `suppose` section of a `Script`.

#### situation\<T\>(description: string, presuppositions: Presupposition\<T\>[]): Presupposition\<T\>

Combine presuppositions into a group that has its own description. Useful for describing
complicated setups.

#### step\<T\>(description: string, validate: (context: T) => void | Promise\<void\>): Action\<T\>

Create an action for the `perform` section of a `Script`.

#### procedure\<T\>(descripion: string, steps: Action\<T\>[]): Action\<T\>

Combine actions into a group that has its own description. Useful for describing
complicated actions.

#### effect\<T\>(description: string, validate: (context: T) => void | Promise\<void\>): Observation\<T\>

Create an observation for the `observe` section of a `Script`.

#### outcome\<T\>(description: string, effects: Observation\<T\>[]): Observation\<T\>

Combine observations into a group that has its own description. Useful for describing
complication assertions.


### Setup and Teardown for a Behavior

If you need to do any setup or teardown for each *example* in a behavior, you should put this
logic in a Context and supply it to each example. Sometimes, however, you may find that you want
to do setup or teardown operations for the Behavior as a whole. For example, suppose there is a
containerized database that will be exercised by all the examples in a behavior, and suppose it is
slow to start and stop this container for each example. In this case, you can use `behaviorContext`
to generate a Context that handles the setup and teardown logic for the behavior as a whole.

#### behaviorContext(context: Context\<T\>): Context\<T\>

Generate a Context based on the provided context. The generated Context will be
initialized the first time it is referenced. The `teardown` function will be called
at the end of the behavior, after all examples have been completed or skipped.


### Validating Behaviors

#### validate(behaviors: ConfigurableBehavior[], options: ValidationOptions): Promise\<Summary\>

This function validates a list of configurable behaviors and returns a promise
that resolves to a summary. Use the DSL functions to create `Behaviors`.

A `ConfigurableBehavior` is a `Behavior` or a function that takes `BehaviorOptions`
and returns a `Behavior`.

A `BehaviorOptions` is an object that exposes `pick` and `skip` methods, which support
validating a particular behavior only or ignoring it, respectively.


#### ValidationOptions

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
to the `validate` function. Set the `NO_COLOR` environment variable to a non-empty value
to disable ANSI codes in the reporter output.
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


## Extending esbehavior

esbehavior is a *framework* for writing executable documentation, and this means that it is
meant to be easy to extend or tailor to your specific use case. Here are some ways to do so:

#### Provide your own Example implementation

An `Example` is just an object that conforms to a particular interface that tells
esbehavior how to validate or skip it. So, you could provide your own implementation
of the `Example` interface to provide an entirely distinct way of describing the
behaviors of your application.

#### Provide your own function that generates an Example

The easiest way to extend esbehavior is to provide your own function that generates
an example. For example, you could write xunit-style tests with a function like this:

```
function test(description: string, block: () => void) {
  return new example()
    .script({
      observe: [
        effect(description, () => {
          block()
        })
      ]
    })
}
```

So the behavior would look like:

```
behavior("my behavior", [
  test("some test", () => {
    const value = computeTheValue()
    expect(value, is(equalTo(7)))
  })
])
```

Or, if you are providing examples of some pure function, you might want to provide
a function that computes the value of the function, and then a list of observations
about the result.

In that case, you might write a function that creates an example that uses a `Context`
that can store a value. Then, as part of the perform step, the function under test
would be executed and the return value would be stored in the context.
Then we map the given observation functions and pass the computed value to them:

```
interface PureFunctionScript<T> {
  check: Array<Observation<T>>
}

class ValueContext<T> {
  private _value: T | undefined

  set(value: T) {
    this._value = value
  }

  get(): T {
    return this._value!
  }
}

export function test<T>(description: string, subject: () => T, script: PureFunctionScript<T>) {
  return example<ValueContext<T>>({ init: () => new ValueContext() })
    .description(description)
    .script({
      perform: [
        step("the function is executed", (context) => {
          context.set(subject())
        })
      ],
      observe: script.check.map((property) => {
        return effect(property.description, (context) => {
          property.validate(context.get())
        })
      })
    })
}
```

Then we could write behaviors like so:

```
behavior("some behavior", [
  test("when the argument is odd", () => someFunction(27), {
    check: [
      effect("the return value is even", (value) => {
        expect(value).to.be.even
      })
    ]
  })
])
```

Using this method, you should be able to craft the DSL that makes the most
sense for describing the behavior of your system.
