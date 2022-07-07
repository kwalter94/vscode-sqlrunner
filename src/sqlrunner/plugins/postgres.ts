import { SqlConnectionAdapter, SqlConnectionParameters, SqlResult } from "../plugin";

import * as pg from 'pg';

export class PostgresConnectionAdapter implements SqlConnectionAdapter {
    private connectionPool: pg.Pool;

    constructor({username: user, password, host, port, database}: SqlConnectionParameters) {
        this.connectionPool = new pg.Pool({host, port, user, password, database});
    }

    close() {
        this.connectionPool.end();
    }

    async runQuery(query: string): Promise<SqlResult> {
        const response = await this.connectionPool.query(query);
        const columnNames = response.fields.map(field => field.name);
        const rows = response.rows.map(row => columnNames.map(columnName => String(row[columnName])));

        return {columnNames, rows};
    }

    async getTables(): Promise<string[]> {
        const {rows} = await this.runQuery(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_name
        `);

        return rows.map(([table]) => table);
    }

    async describeTable(table: string): Promise<SqlResult> {
        return this.runQuery(`
            SELECT column_name,
                   data_type,
                   is_nullable,
                   column_default
            FROM information_schema.columns
            WHERE table_name = '${table}'
            ORDER BY ordinal_position
        `);
    }
}
