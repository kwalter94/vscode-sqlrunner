// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const commands = require('./sqlrunner/vscode/commands');
const TablesPanel = require('./sqlrunner/vscode/tables_panel');

function addCommand(context, name, command) {
    context.subscriptions.push(vscode.commands.registerCommand(name, () => command(context)));
}

/**
 * @param {vscode.ExtensionContext} context 
 * @param {string} viewType 
 * @param {vscode.WebviewViewProvider} viewProvider 
 */
function addWebviewProvider(context, viewType, viewProvider) {
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(viewType, viewProvider));
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('SQL Runner activated!!!');

    const [viewType, provider] = commands.initTablesPanel(context);

    addWebviewProvider(context, viewType, provider);

    addCommand(context, 'sqlrunner.connectToDatabase', commands.connectToDatabase);
    addCommand(context, 'sqlrunner.refreshTables', commands.loadTables);
    addCommand(context, 'sqlrunner.runQuery', commands.runQuery);
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}
