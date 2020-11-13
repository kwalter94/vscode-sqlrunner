const vscode = require('vscode');

const SqlConnection = require('../sql_connection');
const SqlResultsViewer = require('./sql_results_viewer');
const {getDatabaseConnectionString, getQuery} = require('./editor');
const {timeIt} = require('../utils');

let state = {
    connection: null,
    resultsViewer: null
};

async function extensionState() {
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


/**
 * Fetches currently selected query in editor and executes it.
 */
async function runQuery() {
    const state = await extensionState();
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
}

module.exports = {runQuery};
