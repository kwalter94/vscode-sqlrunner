// FIXME: The password field in the regex is too limited, can't match
//        passwords with odd characters in them. Also need to figure
//        out how to deal with @ in any part of the connection string
//        since that character has has a special meaning in the
//        connection string.
const CONNECTION_STRING_REGEX = /(?<dbms>\w+):\/\/((?<username>\w+[a-z0-9]*):(?<password>.+)@)?(?<host>[a-z0-9-.~]+)(\:(?<port>\d+))?\/(?<database>\w+[a-z0-9]*)/im;

function tryMethod(object, method, ...args) {
    if (!object[method]) return undefined;

    return object[method](...args);
}

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

        if (!dbms) {
            throw new Error(`Invalid connection string: ${connectionString}`);
        }

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

        return new this(dbms, `${host}:${port || 'default'}/${database}`, adapter);
    }

    constructor(dbms, host, adapter) {
        this.dbms = dbms;
        this.host = host;
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

    getName() {
        return `${this.dbms}: ${this.host}`;
    }

    async getTables() {
        return tryMethod(this.adapter, 'getTables') || [];
    }

    async describeTable(table) {
        return tryMethod(this.adapter, 'describeTable', table) || {columnNames: [], rows: []};
    }

    static _parseConnectionString(connectionString) {
        const match = CONNECTION_STRING_REGEX.exec(connectionString);

        const {dbms, username, password, host, port, database} = match?.groups || {};

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