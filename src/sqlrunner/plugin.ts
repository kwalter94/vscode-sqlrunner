export interface SqlConnectionParameters {
    username: string;
    password: string;
    host: string;
    port?: number;
    database: string;
}

export type SqlRow = string[];

export interface SqlResult {
    columnNames: string[];
    rows: SqlRow[];
}

/**
 * Connection to a database
 */
export interface SqlConnectionAdapter {
    /**
     * Run SQL query on database
     */
    runQuery(query: string): Promise<SqlResult>;
    
    /**
     * Retrieve all tables from this database
     */
    getTables(): Promise<string[]>;
    
    /**
     * Fetch table description from this database
     */
    describeTable(tableName: string): Promise<SqlResult>;
    
    /**
     * Terminate connection to database
     */
    close(): void;
}
    
export type SqlConnectionPlugin = (params: SqlConnectionParameters) => SqlConnectionAdapter