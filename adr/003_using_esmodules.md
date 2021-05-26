# Build BDVP as an ES module

## Status: Accepted

## Context
We can build BDVP from Typescript using a variety of module bundlers. CommonJS is the standard for node
but doesn't work in the browser (without bundling of some sort). ESModules are the new standard and they
do work in the browser but don't work in node without a few tweaks. 

If we build BDVP as an esmodule then it makes it possible to load it directly in the browser and tools like
snowpack will work with it without further config or plugins. And theoretically we could import BDVP directly
via a `import` statement with a URL if it were hosted somewhere. This lowers the time to run tests since no
bundling step is really necessary.

One downside to esmodules is that in node, if you have a project that's using commonjs then it cannot
`require` an esmodule (although an esmodule can `import` a commonjs module). So in order to allow BDVP to
be used with whatever sort of module system, we will probably need to build two versions, one that uses
esmodule and one that uses commonjs and do something with the 'export map' in package.json to provide the
correct module when necessary.

## Decision
We will begin by building BDVP as an esmodule. This opens up different sorts of use cases when validating
docs in the browser so it seems worthwhile -- namely, using BDVP directly without having to bundle document
files.

To use BDVP with node, we will set the `type` field of package.json to `module`. We may need to change this
in the future if we use an export map to provide different types of modules depending on the system.

## Consequences
One downside of esmodules right now is that the path to a module needs to be explicit. In particular, without
adding the proper file extension, the browser will not load the correct module. And while Typescript
has the ability to resolve paths without requiring extensions, when compiled to an esmodule tsc does not
add the relevant extension to make it work. And according to github issues they do not plan to ever implement
this. The recommendation is to add a `.js` extension to all imports in Typescript so that when the files are
compiled the import will be explicit and point to the correct file. So, now all our imports in BDVP end with
`.js` even though there is no file in our source code with that extension ...

Until we figure out the 'export map' approach and build for both commonjs and esmodule then any node program
that uses BDVP will also have to be an esmodule program ...