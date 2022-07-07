/**
 * Helper functions for interacting with the Visual Studio Code editor.
 */

import * as vscode from 'vscode';

/**
 * Check if the selection covers nothing
 */
function isNothingSelected({start, end}: vscode.Selection): boolean {
    return start.line === end.line && start.character === end.character;
}

/**
 * Retrieve currently selected text or line in the editor.
 * 
 * @param {vscode.TextEditor} editor
 * 
 * @returns {Promise<string>}
 */
async function getSelectedText(editor: vscode.TextEditor): Promise<string> {
    console.table(editor.selection);

    if (isNothingSelected(editor.selection)) {
        // HACK: Select entire line by expanding selection twice.
        //       Need to find a cleaner way of doing this.
        await vscode.commands.executeCommand('expandLineSelection');
        await vscode.commands.executeCommand('expandLineSelection');
    }

    console.table(editor.selection);
    console.log(editor.document.getText(editor.selection));

    return editor.document.getText(editor.selection);
}

export async function getDatabaseConnectionString(initialConnectionString: string | null = null): Promise<string | undefined> {
    console.log(`window: ${vscode.window}`);
    return vscode.window.showInputBox(
        {
            placeHolder: 'dbms://username:password@host:port/database',
            ignoreFocusOut: true,
            prompt: 'Connection string',
            value: initialConnectionString || ''
        }
    );
}

export async function getQuery(): Promise<string | null> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage('No active text editor to get SQL query from.');
        return null;
    }

    return getSelectedText(editor);
}
