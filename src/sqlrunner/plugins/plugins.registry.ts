import { SqlConnectionParameters, SqlConnectionPlugin } from "../plugin";
import { MySqlConnectionAdapter } from "./mysql";
import { PostgresConnectionAdapter } from "./postgres";

const registry = new Map<string, SqlConnectionPlugin>();

// Register your plugins below
registry.set('mysql', (params: SqlConnectionParameters) => new MySqlConnectionAdapter(params));
registry.set('postgres', (params: SqlConnectionParameters) => new PostgresConnectionAdapter(params));

export default registry;
