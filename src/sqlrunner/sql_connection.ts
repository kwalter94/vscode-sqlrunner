import { SqlConnectionPlugin, SqlConnectionAdapter, SqlConnectionParameters, SqlResult} from "./plugin";
import registry from "./plugins/plugins.registry";

// FIXME: The password field in the regex is too limited, can't match
//        passwords with odd characters in them. Also need to figure
//        out how to deal with @ in any part of the connection string
//        since that character has has a special meaning in the
//        connection string.
const CONNECTION_STRING_REGEX = /(?<dbms>\w+):\/\/((?<username>\w+[a-z0-9]*):(?<password>.+)@)?(?<host>[a-z0-9-.~]+)(:(?<port>\d+))?\/(?<database>\w+[a-z0-9]*)/im;

export default class SqlConnection {
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
     * @param connectionString
     * 
     * @throws {ConnectionError}
     */
    static fromConnectionString(connectionString: string): SqlConnection {
        const {dbms, connectionParams} = this._parseConnectionString(connectionString);

        if (!dbms) {
            throw new Error(`Invalid connection string: ${connectionString}`);
        }

        return this.from(dbms, connectionParams);
    }

    /**
     * Creates an SQLConnection to database.
     * 
     * @param dbms is the target database management system (eg mysql, postgres, etc)
     */
    static from(dbms: string, params: SqlConnectionParameters) {
        const plugin: SqlConnectionPlugin | undefined = registry.get(dbms.toLowerCase());
        if (!plugin) {
            throw new Error(`Unknown dbms: ${dbms}`);
        }
        const adapter: SqlConnectionAdapter = plugin(params);

        return new this(dbms, `${params.host}:${params.port || 'default'}/${params.database}`, adapter);
    }
    
    private dbms: string;
    private host: string;
    private adapter: SqlConnectionAdapter;

    private constructor(dbms: string, host: string, adapter: SqlConnectionAdapter) {
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
    async runQuery(query: string): Promise<SqlResult> {
        return this.adapter.runQuery(query);
    }

    close() {
        this.adapter.close();
    }

    getName(): string {
        return `${this.dbms}: ${this.host}`;
    }

    async getTables(): Promise<string[]> {
        return this.adapter.getTables();
    }

    async describeTable(table: string): Promise<SqlResult> {
        return this.adapter.describeTable(table);
    }

    static _parseConnectionString(connectionString: string): {dbms: string, connectionParams: SqlConnectionParameters} {
        const match = CONNECTION_STRING_REGEX.exec(connectionString);

        const {dbms, username, password, host, port, database} = match?.groups || {};
        
        return {
            dbms,
            connectionParams: {
              username,
              password,
              host,
              port: port ? Number.parseInt(port) : undefined,
              database
            }
        };
    }
}