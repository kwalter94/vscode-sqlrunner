import * as vscode from 'vscode';

import SqlConnection from '../sql_connection';
import SqlResultsView from './sql_results_view';
import { getDatabaseConnectionString, getQuery } from './editor';
import { timeIt } from '../utils';
import { DatabaseObjectsTreeProvider } from './database_objects_tree_provider';

export type Command = (context: vscode.ExtensionContext, args: any[]) => void;

interface ExtensionState {
    connection: SqlConnection | null;
    resultsView: SqlResultsView | null;
}

// NOTE: This should only be accessed through `extensionState()`, never directly.
const state: ExtensionState = {connection: null, resultsView: null};

async function extensionState(context: vscode.ExtensionContext, {initialiseResultsView} = {initialiseResultsView: true}):
    Promise<ExtensionState>
{
    console.log('Retrieving/Creating extension state...');
    if (!state.connection) {
        await connectToDatabase(context);
    }

    if (initialiseResultsView && !state.resultsView) {
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
export async function connectToDatabase(context: vscode.ExtensionContext, _args: any[] = [], rejectedConnectionString: string | null = null) {
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
        await loadTables(context);
        vscode.window.showInformationMessage(`Connected to database: ${state.connection.getName()}`);
    } catch (e: any) {
        console.error(`Error connecting to database: ${e}`);
        vscode.window.showErrorMessage(`Failed to establish database connection: ${e}`);
        connectToDatabase(context, [], connectionString);
    }
}

/**
 * Fetches currently selected query in editor and executes it.
 * 
 * @param {vscode.ExtensionContext} context
 */
export async function runQuery(context: vscode.ExtensionContext, _args: any[]) {
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

export async function loadTables(context: vscode.ExtensionContext, _args: any = null) {
    const state = await extensionState(context, {initialiseResultsView: false});

    if (!state.connection) {
        console.warn('Failed to load tables: No connection available');
        return;
    }

    const dbObjectsProvider = new DatabaseObjectsTreeProvider(state.connection);
    vscode.window.registerTreeDataProvider('sqlrunner-database-objects', dbObjectsProvider);
}

export async function describeTable(context: vscode.ExtensionContext, [table, ..._]: any[]) {
    const state = await extensionState(context);

    if (!state.connection) {
        vscode.window.showErrorMessage('Failed to describe table: Connection not available');
        return;
    }
    
    const tableName: string = table.getName();

    console.log(`Describing table: ${tableName}`);
    const results = await state.connection.describeTable(tableName);
    state.resultsView?.showResults({...results, time: null});
}
