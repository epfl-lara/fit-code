# Fit Code

This is a Visual Studio Code extension for syntax highlighting in [Stainless Fit](https://github.com/epfl-lara/stainlessfit).

## Installing

Download the latest release and use `code --install-extension fit-code-0.0.6.vsix` to install the extension in VS Code.

## Packaging

You can rebuild the file `fit-code-0.0.6.vsix` from source by running
`vsce package` (after installing `vcse` with `npm install -g vsce` and all
dependencies of the project using `npm install`).

## Description

This extension contains:
* [A grammar](syntaxes/stainless-fit.tmLanguage.json) to define the scopes of the syntax.
* [A theme file](themes/stainless-fit-color-theme.json) for changing the colors associated to the scopes defined above.
* [A dark theme file](themes/stainless-fit-dark-color-theme.json).
* [A typescript file](src/extension.ts) that defines the following commands: `extension.eraseTypeAnnotations`, `extension.evaluateCurrentFile`, `extension.typecheckCurrentFile` (bound in [package.json](package.json) to `Ctrl+K Ctrl+V`).
* [Configuration](package.json) for the path to the executable, as well as the options it should be used with.
