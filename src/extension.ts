// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as commands from './sqlrunner/vscode/commands';

function addCommand(context : vscode.ExtensionContext, name : string, command: commands.Command) {
    console.log(`Registering command: ${name}`);
    context.subscriptions.push(vscode.commands.registerCommand(name, (...args) => command(context, args)));
}

export function activate(context: vscode.ExtensionContext) {
    console.log('SQL Runner activated!!!');
    addCommand(context, 'sqlrunner.connectToDatabase', commands.connectToDatabase);
    addCommand(context, 'sqlrunner.refreshTables', commands.loadTables);
    addCommand(context, 'sqlrunner.runQuery', commands.runQuery);
    addCommand(context, 'sqlrunner.describeTable', commands.describeTable);
}

// this method is called when your extension is deactivated
export function deactivate() {
    console.log('Deactivating extension'); // Only here to shut up eslint
}
