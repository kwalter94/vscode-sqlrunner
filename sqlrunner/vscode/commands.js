const vscode = require('vscode');

const SqlConnection = require('../sql_connection');
const SqlResultsViewer = require('./sql_results_viewer');
const {getDatabaseConnectionString, getQuery} = require('./editor');
const {timeIt} = require('../utils');

let state = {
    connection: null,
    resultsViewer: null
};

/**
 * @param {vscode.ExtensionContext} context 
 */
async function extensionState(context) {
    console.log('Retrieving/Creating extension state...');

    if (!state.connection) await connectToDatabase(context);

    if (!state.resultsViewer) {
        state.resultsViewer = new SqlResultsViewer(context.extensionUri, {onDispose: destroyExtensionState});
    }

    return state;
}

function destroyExtensionState() {
    console.log('Destroying extension state');
    state.connection?.close();
    state.connection = null;
    state.resultsViewer = null;
}

/**
 * Attempt to make a database connection.
 */
async function connectToDatabase(_context) {
    if (state.connection) {
        console.log(`Disconnecting database ${state.connection.getName()}...`)
        state.connection.close();
        state.connection = null;
    }

    const connectionString = await getDatabaseConnectionString();

    if (!connectionString) {
        vscode.window.showInformationMessage('SQL Runner cancelled...');
        return null;
    }

    try {
        console.log(`Connecting to database: ${connectionString}`);
        state.connection = SqlConnection.fromConnectionString(connectionString);
        vscode.window.showInformationMessage(`Connected to database: ${state.connection.getName()}`);
    } catch (e) {
        console.error(e);
        vscode.window.showErrorMessage(`Failed to establish database connection: ${e}`)
    }
}

/**
 * Fetches currently selected query in editor and executes it.
 * 
 * @param {vscode.ExtensionContext} context
 */
async function runQuery(context) {
    const state = await extensionState(context);
    const query = await getQuery();

    if (!query) {
        vscode.window.showErrorMessage("No query selected!");
        return;
    }

    try {
        state.resultsViewer.showLoader();
        const [executionTime, results] = await timeIt(() => state.connection.runQuery(query));
        state.resultsViewer.showResults({...results, time: executionTime});
    } catch (e) {
        state.resultsViewer.showError(`Query failed: ${e}`);
    }
}

module.exports = {connectToDatabase, runQuery};
