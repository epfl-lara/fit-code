import {ExtensionContext,window,commands,workspace,ProgressLocation,Progress,ProgressOptions} from 'vscode'
import { exec } from 'child_process'

const outputChannel = window.createOutputChannel("Fit Code")
const info = " [INFO]\t"
const successWithoutError = "Command succesded, see output"
const successWithError =    "Command succeded with some error, see output"


export function activate(context: ExtensionContext) {

  console.log('Stainless Fit extension is now active!')
  outputChannel.appendLine(`${info}Stainless Fit extension is now active!`)


  var exec = require('child_process').exec, child

  child = exec(`${fit()}`,
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
    let editor = window.activeTextEditor

    if (editor) {
      let document = editor.document
      let path = document.fileName
      let filename = pathToFilename(path)

      const cmd = `${fit()} eval --no-colors ${options()} "${path}"`

      run(cmd, cr => {
        console.log(cr.stdout)
        console.log(cr.stderr)
        if(cr.stderr.length > 0){
          window.showInformationMessage(successWithError)
          outputChannel.append(`${info}Evaluating ${filename} yielded:\n${cr.stdout}\n${info}With error(s):\n${cr.stderr}`)
        }else{
          window.showInformationMessage(successWithoutError)
          outputChannel.append(`${info}Evaluating ${filename} yielded:\n${cr.stdout}`)
          outputChannel.show
        }


      })
    }
  })

  let typecheckCurrentFile = commands.registerCommand('extension.typecheckCurrentFile', () => {
    let editor = window.activeTextEditor

    if (editor) {
      let document = editor.document
      let path = document.fileName
      let filename = pathToFilename(path)

      const cmd = `${fit()} typecheck --no-info ${options()} "${path}"`

      run(cmd, cr => {
        console.log(cr.stdout)
        console.log(cr.stderr)
        if(cr.stderr.length > 0){
          window.showInformationMessage(successWithError)
          outputChannel.append(`${info}Typechecking ${filename} yielded:\n${cr.stdout}\n${info}With error(s):\n${cr.stderr}`)
        }else{
          window.showInformationMessage(cr.stdout)
        }
      })
    }
  })

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

async function sh(cmd: string): Promise<CommandReturn> {
  return new Promise(function (resolve, reject) {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve(new CommandReturn(stdout, stderr))
      }
    })
  })
}

function defaultOnFailure(error: string): void {
  console.log('exec error: ' + error)
  window.showErrorMessage("Command failed, see output")
  outputChannel.appendLine(error)
  outputChannel.show()
}

function run(cmd: string, onSuccess: (stdout: CommandReturn) => void, onFailure = defaultOnFailure): Thenable<CommandReturn> {
  console.log(`Running ${cmd}`)

  let progress = window.withProgress({
    location: ProgressLocation.Notification,
    title: "Running " + cmd,
    cancellable: false
  }, (progress, token) => {
    // token.onCancellationRequested(() => {
    //   console.log("User canceled the long running operation")
    // })
    let promise: Promise<CommandReturn> = sh(cmd)
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
  constructor(readonly stdout: string,readonly stderr: string){}
}

export function deactivate() {
  outputChannel.dispose()
}
