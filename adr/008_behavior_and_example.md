# Behaviors and Examples

Esbehavior has a few main concepts: behaviors, examples, and claims.

The question here is: how should we represent behaviors and examples? The two main
options seem to be that we could represent either as *data* or as an *interface*. When
we represent something as data, I mean that it just is a collection of values. When we
represent something as an interface, I mean that it exposes functions that can be
implemented in a variety of ways. Something exposed as an interface could have some
internal logic, while something exposed as data just provides references to that data.

### Background

*Documentation* is composed of *behaviors*. Each behavior is demonstrated
by one or more *examples*. And each example makes a series of *claims*.

For example, if we were to write documentation for a piece of software that
calculates the score of a game of bowling, we might have:

- [Behavior] Calculating the score
  - [Example] There are only gutter balls
    - [Claim] The calculator accepts the score for each roll
    - [Claim] The score is zero
  - [Example] There are no strikes or spares
    - [Claim] The score is the sum of the pins knocked down
  - [Example] There is one spare
    - [Claim] The score includes the frame after the spare twice, as a bonus
  - [Example] There is one strike
    - [Claim] The score includes the next two frames after the strike twice, as a bonus
  - [Example] There are all strikes
    - [Claim] The score is 300

Note that most claims are explicit -- checking that the output of the score
calculator equals some expected value. But some claims are implicit; for example,
the first example claims that the calculator will accept the score for each roll --
that's a claim about the API.

Here we are decribing the behavior of a *pure function*, and so the examples generally
look like: give the function some input and expect a certain output.

But some examples can be more complicated. Here's a behavior for a web application:

- [Behavior] Viewing notes
  - [Example] There are existing notes
    - [Claim] Some notes for a certain user exist
    - [Claim] That user is logged in
    - [Claim] The user visits the home page
    - [Claim] The user clicks to see the notes
    - [Claim] The expected notes appear
  - [Example] There are no existing notes for this user
    - [Claim] Some notes for a certain user exist
    - [Claim] Some other user is logged in
    - [Claim] That user visits the home page
    - [Claim] That user clicks to see the notes
    - [Claim] No notes appear

In this case, each example is a bit more complicated. And it's even possible to break down
the various claims into general groups -- presuppositions, actions taken, and observations made.

Indeed, we might want to do different things based on which group a particular claim falls into.
For example, if a preupposition fails, then we might want to stop the entire example, since
it seems that the conditions assumed by the subsequent claims are not valid. But if an observation
fails, we might want to continue evaluating the other observation claims, since all the conditions
for those observations should be valid.

In both cases, the behavior is just a description and a series of examples. But each example
might have its own internal logic.

### Decision

We will represent behaviors as data, and we will represent examples as an interface.

This means that a behavior will always be just a description and a collection of examples. But
an example could have a variety of implementations, each with their own validation logic.

Right now, there is only one implementation of the `Example` interface. We don't really have
a good name for it yet, but it's something like an 'indirect' example, where we do some things
and then observe some effects, but we're not directly invoking a function and inspecting its output.

But since we are exposing the `Example` interface, a test writer could implement their own kind
of example that might make it easier for them to describe the behaviors of their application.

In the future, we hope to provide another kind of example that helps with the first case above,
where the example is meant to make claims about the output of a pure function, given certain
inputs.