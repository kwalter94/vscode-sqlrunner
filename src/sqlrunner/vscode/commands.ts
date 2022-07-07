import * as vscode from 'vscode';

import SqlConnection from '../sql_connection';
import SqlResultsView from './sql_results_view';
import { TablesPanel, VIEW_ID } from './tables_panel';
import { getDatabaseConnectionString, getQuery } from './editor';
import { timeIt } from '../utils';

export type Command = (context: vscode.ExtensionContext) => void;

interface ExtensionState {
    connection: SqlConnection | null;
    resultsView: SqlResultsView | null;
    tablesPanel: TablesPanel | null;
}

const state: ExtensionState = {connection: null, resultsView: null, tablesPanel: null};

export function initTablesPanel(context: vscode.ExtensionContext): [string, TablesPanel] {
    // TODO: Have to figure out where to place this function.
    //       Seems out of place being within the commands module.
    const onTableClicked = async (event: any) => {
        const state = await extensionState(context);
        if (!state?.connection) return;

        const results = await state.connection.describeTable(event.table);
        state.resultsView?.showResults({...results, time: null});
    };

    state.tablesPanel = new TablesPanel(context.extensionUri, {onTableClicked});

    return [VIEW_ID, state.tablesPanel];
}

async function extensionState(context: vscode.ExtensionContext): Promise<ExtensionState> {
    console.log('Retrieving/Creating extension state...');
    if (!state.connection) {
        await connectToDatabase(context);
    }

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
    state.tablesPanel = null;
}

/**
 * Attempt to make a database connection.
 */
export async function connectToDatabase(context: vscode.ExtensionContext, rejectedConnectionString: string | null = null) {
    console.log('Connecting to database...');
    if (state.connection) {
        console.log(`Disconnecting database ${state.connection.getName()}...`);
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
    } catch (e: any) {
        console.error(`Error connecting to database: ${e}`);
        vscode.window.showErrorMessage(`Failed to establish database connection: ${e}`);
        connectToDatabase(context, connectionString);
    }
}

/**
 * Fetches currently selected query in editor and executes it.
 * 
 * @param {vscode.ExtensionContext} context
 */
export async function runQuery(context: vscode.ExtensionContext) {
    const state = await extensionState(context);
    const query = await getQuery();

    if (!query) {
        vscode.window.showErrorMessage("No query selected!");
        return;
    }

    try {
        state.resultsView?.showLoader();
        const [executionTime, results] = await timeIt(() => {
            if (!state.connection) {
                throw new Error('Illegal state: ExtensionState is missing connection');
            }

            return state.connection.runQuery(query);
        });
        state.resultsView?.showResults({...results, time: executionTime});
    } catch (e: any) {
        console.error(`Query failed: ${e} - ${e.message}`);
        state.resultsView?.showError(`Query failed: ${e}`);
    }
}

export async function loadTables() {
    if (!state.tablesPanel) return;

    const tables = await state.connection?.getTables();
    state.tablesPanel.setTables(tables || []);
}
