// FIXME: The password field in the regex is too limited, can't match
//        passwords with odd characters in them. Also need to figure
//        out how to deal with @ in any part of the connection string
//        since that character has has a special meaning in the
//        connection string.
const CONNECTION_STRING_REGEX = /(\w+):\/\/(\w+):([^@]+)@(\w+):(\d+)\/(\w+)/i;

class SqlConnection {
    /**
     * Create a connection to a database using a connection string.
     * 
     * Connection string has to be of the following format:
     * 
     *      dbms://username:password@host:port/database
     * 
     * Example:
     * 
     *      mysql://skurge:ragnarok@localhost:3306/asgard
     * 
     * NOTE: The port and database can be omitted, in which case the default
     *       port for the chosen dbms will be used and no database will be
     *       selected.
     * 
     * @param {string} connectionString
     * 
     * @returns {SqlConnection}
     * 
     * @throws {ConnectionError}
     */
    static fromConnectionString(connectionString) {
        const {dbms, ...connectionParams} = this._parseConnectionString(connectionString);

        return this.from(dbms, connectionParams);
    }

    /**
     * Creates an SQLConnection to database.
     * 
     * @param {string} dbms is the target database management system (eg mysql, postgres, etc)
     * @param {{username:string, password:string, host:string, port:number, database:string}} param1
     * 
     * @returns {SqlConnection}
     */
    static from(dbms, {username, password, host, port, database}) {
        const SqlConnectionAdapter = require(`./sql_connection_adapters/${dbms}`);
        const adapter = new SqlConnectionAdapter(username, password, host, port, database);

        return new this(adapter);
    }

    constructor(adapter) {
        this.adapter = adapter;
    }

    /**
     * Execute an SQL query on the connected database.
     * 
     * @param {string} query An SQL statement to execute
     * 
     * @returns {Promise<Array>}
     */
    async runQuery(query) {
        return this.adapter.runQuery(query);
    }

    close() {
        this.adapter.close();
    }

    static _parseConnectionString(connectionString) {
        const match = CONNECTION_STRING_REGEX.exec(connectionString);

        const [dbms, username, password, host, port, database] = match?.slice(1, 7) || [];

        return {
            dbms,
            username,
            password,
            host,
            port: port && Number.parseInt(port),
            database
        };
    }
}

module.exports = SqlConnection;