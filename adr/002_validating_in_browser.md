# Validating Docs in a Web Browser

## Status: Accepted

## Context
We want to be able to validate BDVP documents in a web browser since often we
are describing examples of applications that run in a web browser. By validating the
examples within the environment that the application will run, we achieve a greater
level of confidence that those examples are actually valid. Furthermore, if an example
is invalid, it can be easier to debug the problem within a browser environment where
it's often easier to see the problem and diagnosis it using the browser developer tools.

In order to validate BDVP documents in a browser, we need to bundle the documents (or
otherwise process them, since we recommend writing documents in Typescript) and serve
them so they can be evaluated in a browser environment.

There are many ways to take a javascript web app and prepare it for running
in a web browser environment. Usually, a team will have some kind of build tool that does
bundling for production and local development, a local dev server is usually available, etc.
Sometimes these build tools have special configurations or plugins required to support
this particular project.

With all this variety, it would be a challenge to write a custom tool that would make it
easy to load and validate BDVP documents in the browser, while also maintaining enough
configurability to support the particular needs of any given project.

## Decision

We will *not* write a custom tool to validate BDVP docs in a web browser.

It's easy enough to use existing tools like esbuild, parcel, or snowpack to process files
so they can be loaded into a web browser. These tools also have built in web servers that can
easily make those files available. Then, using Playwright, it's just a few lines of code to
load the entrypoint in the browser and print the console logs to standard out where a reporter
can then process them.

In order to support usage of esbuild or snowpack (which provide the fastest processing), we've
made the BDVP package an 'es module' package. This allows it to be loaded directly in the
browser -- or at least to be loaded directly by snowpack. This seems like a good move in any case
to make BDVP fit with modern usage.

## Consequence

There's a bit more work that users of BDVP will need to do in order to validate BDVP docs
in a browser. But we have an example in the samples directory.

We also should re-consider whether bdvp-node is actually necessary. It's really just 15 lines of
code wrapped in some stuff to get command line params. And someone would need to register ts-node or
esbuild-register or babel or something to process modules as they are loaded. But again, it kind of depends
on how a given project is set up as to which tool makes most sense. So, I think we should
delete the bdvp-node package and just make sure to provide a sample that shows how one could validate
BDVP docs in node.