const vscode = require('vscode');

const SqlConnection = require('../sql_connection');
const SqlResultsView = require('./sql_results_view');
const {getDatabaseConnectionString, getQuery} = require('./editor');
const {timeIt} = require('../utils');

let state = {
    connection: null,
    resultsView: null
};

/**
 * @param {vscode.ExtensionContext} context 
 */
async function extensionState(context) {
    console.log('Retrieving/Creating extension state...');

    if (!state.connection) await connectToDatabase(context);

    if (!state.resultsView) {
        state.resultsView = new SqlResultsView(context.extensionUri, {onDispose: destroyExtensionState});
    }

    return state;
}

function destroyExtensionState() {
    console.log('Destroying extension state');
    state.connection?.close();
    state.connection = null;
    state.resultsView = null;
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
        state.resultsView.showLoader();
        const [executionTime, results] = await timeIt(() => state.connection.runQuery(query));
        state.resultsView.showResults({...results, time: executionTime});
    } catch (e) {
        state.resultsView.showError(`Query failed: ${e}`);
    }
}

module.exports = {connectToDatabase, runQuery};
