// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const SqlConnection = require('./sqlrunner/sql_connection');
const SqlResultsViewer = require('./sqlrunner/vscode/sql_results_viewer');
const { getDatabaseConnectionString, getQuery } = require('./sqlrunner/vscode');
const { hrtime } = require('process');


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
            state.resultsViewer = new SqlResultsViewer(
                {
                    onDispose: () => {
                        state.connection?.close();
                        state.connection = null;
                        state.resultsViewer = null;
                    }
                }
            );
        }

        return state;
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to establish database connection: ${error}`)
    }
}

const NANOS_PER_SECOND = 1_000_000_000;

function nanosToSeconds(nanos) {
    return Number(nanos) / NANOS_PER_SECOND;
}

/**
 * Time the execution of an async operation.
 * 
 * @param {() => Promise} operation 
 */
async function timeIt(operation) {
    const startTime = hrtime.bigint();
    const result = await operation();
    const endTime = hrtime.bigint();

    return [nanosToSeconds(endTime - startTime), result];
}

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
                try {
                    const [executionTime, results] = await timeIt(() => state.connection.runQuery(query));
                    state.resultsViewer.renderSqlResults(results);
                    vscode.window.showInformationMessage(`Query executed in approximately ${executionTime} seconds`);
                } catch (e) {
                    vscode.window.showErrorMessage(`Query failed: ${e}`);
                }
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
