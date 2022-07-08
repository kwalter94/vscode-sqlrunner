import * as vscode from 'vscode';
import * as path from 'path';
import SqlConnection from '../sql_connection';

/**
 * Provides table data for tree views
 * 
 * @implements {vscode.TreeDataProvider<String>}
 */
export class DatabaseObjectsTreeProvider implements vscode.TreeDataProvider<DatabaseObject> {
    constructor(private database: SqlConnection) {}

    getTreeItem(dbObject: DatabaseObject): vscode.TreeItem {
        return dbObject;
    }
    
    async getChildren(dbObject: DatabaseObject | undefined): Promise<DatabaseObject[]> {
        if (!dbObject) {
            return this.getRootObjects();
        }
        
        return dbObject.getChildren();
    }

    private getRootObjects(): DatabaseObject[] {
        return [
            new TablesContainer(this.database),
        ];
    }
}

abstract class DatabaseObject extends vscode.TreeItem {
    abstract getName(): string;
    abstract getChildren(): Promise<DatabaseObject[]>;
}

const MEDIA_PATH = path.join(__dirname, '..', '..', '..', 'media');
console.log(MEDIA_PATH);

class Table extends DatabaseObject {
    constructor(private database: SqlConnection, private name: string) {
        super(name, vscode.TreeItemCollapsibleState.None);
    }

    getName(): string {
        return this.name;
    }
    
    async getChildren(): Promise<DatabaseObject[]> {
        // TODO: Return fields???
        return [];
    }
    
    iconPath = path.join(MEDIA_PATH, 'images', 'table-solid.svg');
    contextValue = 'table';
}

class TablesContainer extends DatabaseObject {
    constructor(private database: SqlConnection) {
        super('Tables', vscode.TreeItemCollapsibleState.Collapsed);
    }
    
    getName(): string {
        return 'Tables';
    }
    
    async getChildren(): Promise<DatabaseObject[]> {
        const tableNames = await this.database.getTables();

        return tableNames.map(name => new Table(this.database, name));
    }
}

