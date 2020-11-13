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
}

module.exports = Postgres;
