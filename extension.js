// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const commands = require('./sqlrunner/vscode/commands');

function addCommand(context, name, command) {
    context.subscriptions.push(vscode.commands.registerCommand(name, () => command(context)));
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('SQL Runner activated!!!');
    addCommand(context, 'sqlrunner.runQuery', commands.runQuery);
    addCommand(context, 'sqlrunner.connectToDatabase', commands.connectToDatabase);
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}
