// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const SqlConnection = require('./sqlrunner/sql_connection');
const SqlResultsViewer = require('./sqlrunner/vscode/sql_results_viewer');
const {getDatabaseConnectionString, getQuery} = require('./sqlrunner/vscode');


let state = {connection: null, resultsViewer: null};

async function getExtensionState() {
    try {
        console.log('Retrieving extension state...');

        if (!state.connection) {
            const connectionString = await getDatabaseConnectionString();
            if (!connectionString) {
                vscode.window.showInformationMessage('SQL Runner cancelled...');
                return null;
            }

            state.connection = SqlConnection.fromConnectionString(connectionString);
        }

        if (!state.resultsViewer) {
            state.resultsViewer = new SqlResultsViewer(() => {
                state.connection?.close();
                state.connection = null;
                state.resultsViewer = null;
            });
        }

        return state;
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to establish database connection: ${error}`)
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('SQL Runner activated!!!');

    context.subscriptions.push(
        vscode.commands.registerCommand('sqlrunner.runQuery', async () => {
            const state = await getExtensionState();
            console.log(`Extension state is ${state}`);

            if (!state) return;

            const query = await getQuery();

            if (query) {
                // TODO: Setup a query timer...
                const results = await state.connection.runQuery(query);
                state.resultsViewer.renderSqlResults(results);

                vscode.window.showInformationMessage(`Query executed in approximately ? seconds`);
            } else {
                vscode.window.showErrorMessage("No query selected!");
            }
        })
    )
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}
