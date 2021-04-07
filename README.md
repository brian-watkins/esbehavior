## Behavior Documentation and Verification Program (BDVP)

BDVP is a framework for producing documentation that works. 

Use BDVP to write *documents* that describe the expected behaviors of your program. 
Each document consists of one or more *scenarios* that together illustrate the behavior
you want to describe. Each scenario consists of some initial state, some actions, and
some observations. BDVP runs each scenario and generates a report that indicates which
scenarios were successful and which failed.

See [the bdvp subproject](./packages/bdvp) for more info.

Check out the [architecture decision records](./adr) for info on development decisions.