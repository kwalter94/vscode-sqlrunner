import * as vscode from "vscode";

/**
 * Provides table data for tree views
 * 
 * @implements {vscode.TreeDataProvider<String>}
 */
export class DatabaseObjectsTreeProvider {
    constructor(private database: any) {}

    getTreeItem(table: any) {
        return table;
    }
    
    getChildren(table: any) {}
}

