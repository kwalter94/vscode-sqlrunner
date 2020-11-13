const mysql = require('mysql');

function unpackObject(object, properties) {
    return properties.map(property => object[property]);
}

class MySqlConnectionAdapter {
    constructor(user, password, host, port, database) {
        this.connectionPool = mysql.createPool({host, port, user, password, database})
    }

    async runQuery(query) {
        return new Promise((resolve, reject) => {
            this.connectionPool.getConnection((error, connection) => {
                const handleError = (error) => {
                    connection.release();
                    reject(error);
                }

                if (error) return handleError(error);

                connection.query(query, (error, results, fields) => {
                    if (error) return handleError(error);

                    const columnNames = fields.map(field => field.name);
                    const rows = results.map(result => unpackObject(result, columnNames));
                    
                    resolve({columnNames, rows});
                    connection.release();
                });
            })
            
        });
    }

    close() {
        this.connectionPool.end();
    }
}

module.exports = MySqlConnectionAdapter;
