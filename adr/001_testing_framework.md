# Testing Framework for BDVP

## Status: Accepted

## Context
BDVP is itself a kind of testing framework, but it feels like we need to use a different
testing framework in order to describe the behavior of BDVP itself. 

BDVP is a Javascript testing framework, and one of the main goals is to be able to run
BDVP in both Node (or Deno) and within a browser environment. We should select a
test framework that can run both in Node (or Deno) and a browser environment so that
we can exercise the code in both places and ensure it works as expected.

There are several options we could use. These are probably the main contenders.

- AVA
- mocha
- jasmine
- jest
- uvu
- zora
- tape
- node-tap

We tried AVA, but it (like node-tap) doesn't run in the browser. Same with (I think) node-tap.
Same with jest (without some work). Tape is nice, but only allows focusing on one test at a
time, which can be annoying. Jasmine and mocha are kind of the old-school contenders, but both
require a little more work to run in the browser I think. By contrast, Tape, Zora, Uvu and Node-Tap
try to follow the idea that test files should be individual programs you run, which makes them
ultimately easier to run in the browser. Zora feels like an updated Tape but runs all tests
concurrently by default which can be annoying if you ever need to run something not concurrently.
Uvu seems like a good compromise but has some extra boilerplate and doesn't seem to allow you
to focus on a single test across all test files -- although maybe there's a pattern for doing that.

## Decision
We will go with Uvu for now as it seems to be simple enough and supposedly runs in the browser.

## Consequence
We may need to switch again, probably to Tape or Zora if Uvu doesn't work out. But luckily
Tape, Uvu, Zora all share a common style so it should be easy to move from one to the other.