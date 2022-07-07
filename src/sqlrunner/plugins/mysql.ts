import * as mysql from 'mysql';
import { SqlConnectionAdapter, SqlConnectionParameters, SqlResult, SqlRow } from '../plugin';

export class MySqlConnectionAdapter implements SqlConnectionAdapter {
    private connectionPool: mysql.Pool;

    constructor({username, password, host, port, database}: SqlConnectionParameters) {
        this.connectionPool = mysql.createPool({
            host,
            port,
            user: username,
            password,
            database
        });
    }

    async runQuery(query: string): Promise<SqlResult> {
        return new Promise((resolve, reject) => {
            this.connectionPool.getConnection((error, connection) => {
                const handleError = (error: mysql.MysqlError) => {
                    console.error(`MySQL error: ${error}`);
                    connection?.release();
                    reject(error);
                };

                if (error) return handleError(error);

                connection.query(query, (error, results, fields) => {
                    if (error) {
                        return handleError(error);
                    }

                    const columnNames = (fields || []).map(field => field.name);
                    const rows: SqlRow[] = results.map((row: any) => columnNames.map(field => String(row[field])));

                    resolve({ columnNames, rows });
                    connection.release();
                });
            });
        });
    }

    async getTables(): Promise<string[]> {
        const {rows} = await this.runQuery('SHOW TABLES');

        return rows.map(([table]) => table);
    }

    async describeTable(table: string): Promise<SqlResult> {
        return this.runQuery(`DESCRIBE ${table}`);
    }

    close() {
        this.connectionPool.end();
    }
}
