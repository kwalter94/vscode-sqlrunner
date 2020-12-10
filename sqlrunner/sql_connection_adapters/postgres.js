const { Pool } = require('pg');
const { unpackObject } = require('../utils');

class Postgres {
    constructor(user, password, host, port, database) {
        this.connectionPool = new Pool({host, port, user, password, database})
    }

    close() {
        this.connectionPool.end();
    }

    async runQuery(query) {
        const response = await this.connectionPool.query(query);
        const columnNames = response.fields.map(field => field.name);
        const rows = response.rows.map(row => unpackObject(row, columnNames));

        return {columnNames, rows};
    }

    async getTables() {
        const {rows} = await this.runQuery(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_name
        `);

        return rows;
    }

    async describeTable(table) {
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

module.exports = Postgres;
