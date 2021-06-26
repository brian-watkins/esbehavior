# Reporting Strategy

## Context

The goal of BDVP is to help people make executable documentation that can be
consumed as documentation (ie that's readable for programmers and non-programmers). One
way we are doing this is by providing a DSL for writing tests in a way that breaks
down a test into smaller component parts to make it clear what's happening. Another way
we want to do this is by providing output from a validation run that could be read
by anyone. To that end, we need to have control over our own reporting.

### A separate TAP reporter?
To get started without having to worry too much about reporting we had BDVP
output results in TAP output. This means we could use any of the existing TAP reporters
to consume and present that output in a nice way. That works fine although I haven't
really found a TAP reporter that's super awesome. And certainly none of them really work
to produce the kind of readable documentation I'm hoping for.

So, we also thought that then we would write our own TAP reporter to present BDVP reports
in an especially nice way. That's cool, but if it is specifically made for BDVP (and not
TAP in general) then it probably shouldn't be a separate package. It's just one more thing
people have to download and setup. And we wouldn't want to take pains to make it work nicely
with just *any* TAP output, I imagine.

So, probably it makes sense to have a standard reporter out of the box for BDVP, plus
TAP output if you need that for some reason. (But why would anyone need that?)

### How do we test it?
We have an abstraction in the code right now for `Reporter` and we have an implementation that
renders reports in TAP output. We could easily provide a new implementation of `Reporter` that
uses a special BDVP format (or replace the TAP implementation). For testing though, should
we have our tests deal with the `Reporter` abstraction directly? Like they could provide a
`TestReporter` implementation. And then we write tests independently for the various implementations
to make sure they do the right thing? There's not much logic in the reporter anyway -- it probably
will be stateless.

Alternatively, we could keep things as they are and just change the test instrument so that it
expects the report to be in our special BDVP format. We could run the test suite multiple times
against different implementations of the Test instrument.

The question here is this: Do we create layers in our test suite that mirror layers in our code? Or
do we run the test suite in different conditions to validate the behavior when the layers
in the code are changed.

I think in this case, since we are creating a programmatic API and we want to expose the `Reporter`
interface anyway, that we should probably test the reporting layer independently.

BUT ...

If we remove the TAP output (or hide it for now), then there's no need really to change our current
test strategy ... we just need to alter the test instrument so the expectations fit our new format.
Note that some expectations currently have to do with TAP output specifically -- like making sure that
the failure report is printed on one line only so it doesn't mess up TAP reporters.

We would always, I think, have a default reporter anyway so that the API is as easy as possible to
set up. So this would be testing the default case.

BUT ...

Am I really adding any value with another console reporter? It will probably just look a lot like tap-difflet.

Ultimately we probably need to have some kind of html reporter, since a PM is not going to look at the
console output (maybe in CI but probably not). What would be cool is to print the html in CI and deploy
it to a server somewhere as part of CI. 

BUT ...

Some tap reporters like tap-difflet are kind of old and haven't been updated, which could result in some
annoying security warnings.

## Decision
We will do ... nothing! [Tap-difflet](https://www.npmjs.com/package/tap-difflet) is good enough for now. And
we should focus efforts on:

1. Validating the API with programmers
2. Considering whether an HTML report consumable by the whole team would actually be valuable