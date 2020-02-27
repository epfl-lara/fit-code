import {ExtensionContext,window,commands,workspace,ProgressLocation,Progress,ProgressOptions} from 'vscode'
import { exec } from 'child_process'


export function activate(context: ExtensionContext) {

  console.log('Stainless Fit extension is now active!')

  let eraseTypeAnnotations = commands.registerCommand('extension.eraseTypeAnnotations', () => {
    let editor = window.activeTextEditor

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

  let evaluateCurrentFile = commands.registerCommand('extension.evaluateCurrentFile', () => {
    let editor = window.activeTextEditor

    if (editor) {
      let document = editor.document
      let filename = document.fileName

      const fit = workspace.getConfiguration('fitcode').executablePath
      const cmd = `${fit} eval --no-info \"`  + filename + "\""

      run(cmd,(stdout: string) => {
        console.log(stdout)
        window.showInformationMessage("Evaluates to:\n" + stdout)
      })
    }
  });

  let typecheckCurrentFile = commands.registerCommand('extension.typecheckCurrentFile', () => {
    let editor = window.activeTextEditor

    if (editor) {
      let document = editor.document
      let filename = document.fileName

      const fit = workspace.getConfiguration('fitcode').executablePath
      const cmd = `${fit} typecheck --no-info \"`  + filename + "\""

      run(cmd,(stdout: string) => {
        console.log(stdout)
        window.showInformationMessage(stdout)
      })
    }
  });

  context.subscriptions.push(eraseTypeAnnotations)
  context.subscriptions.push(evaluateCurrentFile)
  context.subscriptions.push(typecheckCurrentFile)
}

/**
 * Execute simple shell command (async wrapper).
 * @param {String} cmd
 * @return {Object} { stdout: String, stderr: String }
 */
async function sh(cmd: string): Promise<string> {
  return new Promise<string>(function (resolve, reject) {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);//resolve([stdout, stderr]);
      }
    });
  });
}

function run(cmd: string, onSuccess: (stdout: string) => void ): Thenable<string> {
  console.log(`Running ${cmd}`);

  let progress = window.withProgress({
    location: ProgressLocation.Notification,
    title: "Running " + cmd,
    cancellable: false
  }, (progress, token) => {
    // token.onCancellationRequested(() => {
    //   console.log("User canceled the long running operation");
    // })
    let promise: Promise<string> = sh(cmd)
    promise.then(onSuccess)
    promise.catch(
      (err) => console.log(err)
    )
    return sh(cmd);
  });

  return progress
}

export function deactivate() {}
