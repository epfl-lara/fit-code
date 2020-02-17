# Syntax Highlighting for Stainless Fit

This is a Visual Studio Code extension for syntax highlighting in [Stainless Fit](https://github.com/epfl-lara/stainlessfit).

## Installing

Use `code --install-extension stainless-fit-0.0.3.vsix` to install the extension in VS Code.

## Packaging

You can rebuild the file `stainless-fit-0.0.3.vsix` from source by running
`vsce package` (after installing `vcse` with `npm install -g vsce` and all
dependencies of the project using `npm install`).

## Description

This extension contains:
* [A grammar](syntaxes/stainless-fit.tmLanguage.json) to define the scopes of the syntax.
* [A theme file](themes/stainless-fit-color-theme.json) for changing the colors associated to the scopes defined above.
* [A dark theme file](themes/stainless-fit-dark-color-theme.json).
* [A typescript file](src/extension.ts) that defines the `extension.eraseTypeAnnotations` command (bound in [package.json](package.json) to `Ctrl+K Ctrl+V`).
