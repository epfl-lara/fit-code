import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {

  console.log('Stainless Fit extension is now active!')

  let eraseTypeAnnotations = vscode.commands.registerCommand('extension.eraseTypeAnnotations', () => {
    let editor = vscode.window.activeTextEditor

    if (editor) {
      let document = editor.document
      let selection = editor.selection
      let text = document.getText(selection)

      // type annotations between square brackets
      let annotation = /\[[^\[\]]*\]/g
      while (text.match(annotation))
        text = text.replace(annotation, "")

      // `fun of` that remain after erasing type annotations
      let emptyFunOf = /fun *of *=/g
      text = text.replace(emptyFunOf, "")

      // a non-space followed by an identifier in parentheses
      let parenthesizedId1 = /([^\s])\((\s*[a-z]\w*\s*)\)/g
      while (text.match(parenthesizedId1))
        text = text.replace(parenthesizedId1, "$1 $2")

      // a space followed by an identifier in parentheses
      let parenthesizedId2 = /\s\((\s*[a-z]\w*\s*)\)/g
      while (text.match(parenthesizedId2))
        text = text.replace(parenthesizedId2, " $1")

      // several spaces after a non-space character
      let severalSpaces = /(\S)[ \t]+/g
      text = text.replace(severalSpaces, "$1 ")

      // trailing spaces
      let trailingSpaces = /[ \t]+([\r\n])/g
      text = text.replace(trailingSpaces, "$1")

      // > three line returns
      let threeLineReturns = /([\n\r][\n\r])[\n\r]+/g
      text = text.replace(threeLineReturns, "$1")

      // initial new lines
      let initialNewLines = /^[\n\r]+/g
      text = text.replace(initialNewLines, "")

      // odd indentation
      let oddIndentation = /([\n\r]) ((?:  )*)(\S)/g
      text = text.replace(oddIndentation, "$1$2$3")

      editor.edit(editBuilder => {
        editBuilder.replace(selection, text);
      });
    }
  });

  let evaluateCurrentFile = vscode.commands.registerCommand('extension.evaluateCurrentFile', () => {
    let editor = vscode.window.activeTextEditor

    if (editor) {
      let document = editor.document
      let filename = document.fileName

      const execSync = require('child_process').execSync;
      const output = execSync("${fitcode.executablePath} eval --no-info \""  + filename + "\"", { encoding: 'utf-8' });
      vscode.window.showInformationMessage("Evaluates to:\n" + output);
    }
  });

  let typecheckCurrentFile = vscode.commands.registerCommand('extension.typecheckCurrentFile', () => {
    let editor = vscode.window.activeTextEditor

    if (editor) {
      let document = editor.document
      let filename = document.fileName

      const execSync = require('child_process').execSync;
      const output = execSync("${fitcode.executablePath} typecheck --no-info \""  + filename + "\"", { encoding: 'utf-8' });
      vscode.window.showInformationMessage(output);
    }
  });

  context.subscriptions.push(eraseTypeAnnotations)
  context.subscriptions.push(evaluateCurrentFile)
  context.subscriptions.push(typecheckCurrentFile)
}

export function deactivate() {}
