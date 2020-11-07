/**
 * Helper functions for interacting with Visual Studio.
 */

const vscode = require('vscode');

/**
 * Check if the selection covers nothing
 * 
 * @param {vscode.Selection} param0 
 * 
 * @returns {boolean}
 */
function isNothingSelected({start, end}) {
    return start.line === end.line && start.character === end.character;
}

/**
 * Retrieve currently selected text or line in the editor.
 * 
 * @param {vscode.TextEditor} editor
 * 
 * @returns {Promise<string>}
 */
async function getSelectedText(editor) {
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

async function getDatabaseConnectionString() {
    return vscode.window.showInputBox({placeHolder: 'dbms://username:password@host:port/database'});
}

async function getQuery() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage('No active text editor to get SQL query from.');
        return null;
    }

    return getSelectedText(editor);
}


module.exports = {getDatabaseConnectionString, getQuery};