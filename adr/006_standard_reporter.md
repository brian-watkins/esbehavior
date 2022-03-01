# Standard Reporter

In an [earlier ADR](./004_reporting.md), we described options for reporting
results of a validation run. At that point, we decided to do nothing different
in terms of testing strategy, etc and continue to use TAP output hooked up to
a reporter to see the results of a validation run.

Tap-difflet is the TAP reporter that most closely approaches what we wanted
in terms of output on the console. But it has not been updated in a while and
doesn't give us all the flexibility we might hope for.

We have a `Reporter` abstraction that we can use to provide a different
implementation. But right now our tests are not aware of that and just test
everything in terms of TAP output. This makes our test suite a bit more
complicated than it needs to be.


### Decision

We will revise the test suite to describe the main behavior of validating
behaviors in terms of the `Reporter` abstraction (with a test reporter). We
will then test the TAPReporter independently. This will allow us to introduce
a new reporter and test that independently as well.

We will change the `validate` function to allow for setting a `Reporter` but
by default we will use a Standard reporter that outputs to the console in a
nice way. If TAP output is needed, then the TAPReporter can be passed in to the
validate function.

We will export the `Reporter`, `Writer`, and `Failure` types at the top level
to allow for creating custom reporters or writers for particular use cases.


### Caveats

Our standard reporter uses ANSI escape codes to print colored output to the
terminal. This appears to work in Chrome, when tests are run there and the
output is piped out to the terminal console -- and the output in the Chrome
debug console is colored as well. Not sure if this will work with other
browsers, but as long as the escape codes are piped to the terminal along
with the other text, it should work fine.