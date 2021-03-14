const vscode = require('vscode');

const SqlConnection = require('../sql_connection');
const SqlResultsView = require('./sql_results_view');
const TablesPanel = require('./tables_panel');
const {getDatabaseConnectionString, getQuery} = require('./editor');
const {timeIt} = require('../utils');

let state = {
    connection: null,
    resultsView: null,
    tablesPanel: null,
};

/**
 * @param {vscode.ExtensionContext} context
 * 
 * @returns {[string, TablesPanel.TablesPanel]}
 */
function initTablesPanel(context) {
    // TODO: Have to figure out where to place this function.
    //       Seems out of place being within the commands module.
    const onTableClicked = async event => {
        const state = await extensionState(context);
        const results = await state.connection.describeTable(event.table);
        state.resultsView.showResults(results);
    };

    state.tablesPanel = new TablesPanel.TablesPanel(context.extensionUri, {onTableClicked});

    return [TablesPanel.VIEW_ID, state.tablesPanel];
}

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
    state.tablesPanel.dispose();
    state.tablesPanel = null;
}

/**
 * Attempt to make a database connection.
 */
async function connectToDatabase(context, rejectedConnectionString = null) {
    if (state.connection) {
        console.log(`Disconnecting database ${state.connection.getName()}...`)
        state.connection.close();
        state.connection = null;
    }

    const connectionString = await getDatabaseConnectionString(rejectedConnectionString);

    if (!connectionString) {
        vscode.window.showInformationMessage('SQL Runner cancelled...');
        return null;
    }

    try {
        console.log(`Connecting to database: ${connectionString}`);
        state.connection = SqlConnection.fromConnectionString(connectionString);
        await loadTables();
        vscode.window.showInformationMessage(`Connected to database: ${state.connection.getName()}`);
    } catch (e) {
        console.error(e);
        vscode.window.showErrorMessage(`Failed to establish database connection: ${e}`);
        connectToDatabase(context, connectionString);
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

async function loadTables() {
    if (!state.tablesPanel) return;

    const tables = await state.connection.getTables();
    state.tablesPanel.showTables(tables);
}

module.exports = {connectToDatabase, loadTables, initTablesPanel, runQuery};
