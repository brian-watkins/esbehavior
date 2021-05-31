# Sample Repo with BDVP Documents

To verify the sample documents:

```
$ npm test
# npm test:browser
```


### Validating documents in the browser

Check out [runner.mjs](./browserSpecs/runner.mjs) for an example of how
to validate BDVP documents in a browser, using Snowpack and Playwright.

It seems to me that it's just too hard to write a custom tool that would
accomplish this without asking someone to write their own script to do it. There
are a variety of build tools one could use, and a variety of ways to deal with
entrypoints, collecting document files, etc. Writing a script that accomplishes
this is pretty straightforward and allows people to use the tools they are familiar
with and configure them for the particularities of their project. It also allows
people to use better tools when they become available.
