# Simpler Scripts

The script DSL for an example is admittedly fairly verbose. While none
of the sections are required, generally, one needs to do at least `suppose`
or `perform` and then `observe`. This is fine for most cases, especially
those that we might call 'indirect' examples where actions are taken and
then effects are observed. For 'direct' example, say, evaluating the
result of a pure function, this DSL can seem like overkill. In addition,
the ergonomics of the API do not readily admit of computing a value as
part of some step and then passing that on to be observed. One would need
to utilize the context, setting a property on the context during some
action and then observing that property later on.

There are several approaches we could take to make it easier to write 'direct'
examples.

1. We could create a different implementation of the `ExampleBuilder` and `Example`
interfaces.

2. We could (somehow) allow the current `Example` implementation to support
different kinds of scripts.

3. We could (somehow) add a presupposition or action function that allows one to
return a value that then becomes the context that subsequent claim functions will
receive.

4. We could make it so that the context init function runs just like any other
presupposition, just without any description that gets printed to the test output.

And there are others.

Of these options, (4) definitely seems like a bad approach because it conflates
context initialization and the computation of a value that will later be observed.
This is bad because context initialization can have a teardown function associated
with it, which takes the initializaed context as an argument. If context initialization
were to fail (like any presupposition could) then it's not clear what would happen
for the teardown function. Would we skip it? But this would perhaps leave resources
in a bad state for the next example. For now, it seems like the clearest thing to do
is to keep the current behavior: if context initialization fails, we fail the entire
validation run, because we assume that the example is in a bad or at least uncertain
state and cannot effectively be validated.

(3) is also a bit tricky because it would require a major change to how claim functions
work -- and it could also make reasoning about the context more difficult.

(1) and (2) seem possible, but would need a lot of work.

### The fifth option

Instead of adjusting current API's or creating new ones, we will utilize esbehavior
like the library that it is and simply remind test writers that they can always write
their own DSL tailored to the use case they need. The very simplest option would be
to have one observation which both computes the value and makes an observation about it:

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

So the test would look like:

```
test("some test", () => {
  const value = computeTheValue()
  expect(value).to.be.even
})
```

A more sophisticated example might have a list of observations that need
to be applied to a computed value. In that case, we would want to write a function
that creates an example which uses a `Context` that can store a value. Then, as part
of the perform step, we run the function to generate that value and store it in the
context. Then we map the given observation functions and pass the computed value to
them:

```
interface SampleScript<T> {
  compute: () => T
  properties: Array<Property<T>>
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

export function test<T>(description: string, script: SampleScript<T>) {
  return example<ValueContext<T>>({ init: () => new ValueContext() })
    .description(description)
    .script({
      perform: [
        step("the value is computed", (context) => {
          context.set(script.compute())
        })
      ],
      observe: script.properties.map((property) => {
        return effect(property.description, (context) => {
          property.validate(context.get())
        })
      })
    })
}
```

Then we could write tests like so:

```
test("just a test", {
  compute: () => someFunction(27),
  properties: [
    property("it is even", (value) => {
      expect(value).to.be.even
    })
  ]
})
```

where `property` is just an alias for `effect`.

In any case, the point here is that we can generate examples in a variety of ways
that provide a simplified API. And for this reason, it doesn't seem like we really
need to modify the existing API.
