# Randomizing behaviors, examples, observations

We want to be able to validate our documentation in random order. We do this
because our documentation should not depend on order: behaviors should not
depend on each other, examples should not depend on each other, observations
should be validated in any order. By randomizing these aspects of the documentation
we can hopefully uncover any bad dependencies among these things, that could
potentially lead to flaky tests. For example, if some fixture is accidentally
modified when used and subsequent examples use the same fixture, they may come
to depend on the mistakenly modified form of that fixture and pass for the wrong
reason.

In order to do this with our tests, we need to be able to *seed* any random
number generator we use. This would allow us to reproduce a given 'random' order
if that random order should make the test suite fail. So basically, if we are
randomzing order and the test suite fails, then we should print out a seed to use
to reproduce the very same ordering.

Unfortunately, the built-in JS random function cannot be seeded. Thus, we will need
to use some random number generator written in JS that can be seeded. Seems like the
[seedrandom](https://www.npmjs.com/package/seedrandom) package is one that is used a lot.

Once we have a sequence of random numbers that can be reproduced given a seed, then
we need to use that sequence to shuffle various arrays -- the array of behaviors,
the array of examples, the array of observations. The recommendation for shuffling
an array seems to be the Fisher-Yates shuffle algorithm. See
[here](https://bost.ocks.org/mike/shuffle/) for a good explanation and an implementation
in JS.

Once we have a way to shuffle an array using a random number generator, then we will
be able to use that to shuffle the list of behaviors, examples within a behavior, and
observations within an example. And if we supply a seed, it should keep the same
order for all of those.