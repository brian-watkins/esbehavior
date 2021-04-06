## Behavior Documentation and Verification Program (BDVP)

BDVP is a framework for producing documentation that works. 

Use BDVP to write *documents* that describe the expected behaviors of your program. 
Each document consists of one or more *scenarios* that together illustrate the behavior
you want to describe. Each scenario consists of some initial state, some actions, and
some observations. BDVP runs each scenario and generates a report that indicates which
scenarios were successful and which failed.

### BDVP sounds like a test framework. Why do we need another test framework?

BDVP is not simply a test framework. It provides a domain specific language that encourages
better documentation practices. It generates reports that could (and should!) be read
by anyone interested in understanding the expected behaviors of the program.

### The DSL

Here's an example:

```
document("some behavior", [
  scenario("the app shows things", context(() => new TestApp()))
    .when("the app loads", (app) => await app.start())
    .observeThat([
      it("shows things", (app) => {
        expect(app.display.things).to.equal(expectedThings)
      })
    ])
])
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