import {ExtensionContext,window,commands,workspace,ProgressLocation,Progress,ProgressOptions} from 'vscode'
import { exec, ExecException } from 'child_process'

const outputChannel = window.createOutputChannel("Fit Code")
const successWithoutError = "Command succeded, see output"
const successWithError =    "Command succeded with some error, see output"

var cp = require('child_process')

function fitCommand(fitCmd: string) {
  let editor = window.activeTextEditor

  if (editor) {
    let document = editor.document
    let path = document.fileName
    //let filename = pathToFilename(path)

    const cmd = `${fit()} ${fitCmd} ${options()} "${path}"`

    run(cmd)
  }
}

export function activate(context: ExtensionContext) {

  console.log('Stainless Fit extension is now active!')
  outputChannel.appendLine(`Stainless Fit extension is now active!`)

  cp.exec(`${fit()}`,
    function (error: string, stdout: string, stderr: string) {
      if (error !== null) {
        window.showErrorMessage(`${fit()} not found: refer to output and README`)
        console.log('exec error: ' + error)
        outputChannel.append(error)
        outputChannel.show
      }
    }
  )

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
        editBuilder.replace(selection, text)
      })
    }
  })

  let evaluateCurrentFile = commands.registerCommand('extension.evaluateCurrentFile', () => {
    fitCommand("eval");
  });

  let typecheckCurrentFile = commands.registerCommand('extension.typecheckCurrentFile', () => {
    fitCommand("typecheck");
  });

  context.subscriptions.push(eraseTypeAnnotations)
  context.subscriptions.push(evaluateCurrentFile)
  context.subscriptions.push(typecheckCurrentFile)
}

function fit() {
  return workspace.getConfiguration('fitcode').executablePath
}

function options() {
  return workspace.getConfiguration('fitcode').executableOptions
}

async function sh(cmd: string): Promise<string> {
  return new Promise(function (resolve, reject) {
    exec(cmd, (err, stdout, stderr) => {
      if ( stdout.length == 0 || err) {
        reject(new CommandReturn(stdout, stderr, err))
      } else {
        resolve(stdout)
      }
    })
  })
}

function defaultOnSuccess(stdout: string): void {
  console.log(stdout)
  window.showInformationMessage(stdout)
  outputChannel.append(stdout)
}

function defaultOnFailure(cr:CommandReturn): void {
  console.log(cr.toString)
  window.showErrorMessage("Error occured, see output")
  outputChannel.append(cr.toString())
}

function run(cmd: string, onSuccess = defaultOnSuccess, onFailure = defaultOnFailure): Thenable<string> {
  let running = `Running ${cmd}`
  console.log(running)

  let progress = window.withProgress({
    location: ProgressLocation.Notification,
    title: running,
    cancellable: false
  }, (progress, token) => {
    // token.onCancellationRequested(() => {
    //   console.log("User canceled the long running operation")
    // })
    let promise = sh(cmd)
    promise.then(onSuccess)
    promise.catch(onFailure)
    return promise
  })

  return progress
}

function pathToFilename(path: string): string{
  let regex = /([^/\\]*[/\\][/\\]*)*/ //leaves only filename
  return path.replace(regex,"")
}

class CommandReturn{
  constructor(readonly stdout: string, readonly stderr: string, readonly err?: ExecException | null){}

  toString() {
    let errString = this.err ? this.err : ""
    return `${this.stdout}${this.stderr}${errString}`
  }
}

export function deactivate() {
  outputChannel.dispose()
}
