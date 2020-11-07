const mysql = require('mysql');

function unpackObject(object, properties) {
    return properties.map(property => object[property]);
}

class MySqlConnectionAdapter {
    constructor(user, password, host, port, database) {
        this.connection = mysql.createConnection({host, port, user, password, database})
        this.connection.connect();
    }

    async runQuery(query) {
        return new Promise((resolve, reject) => {
            this.connection.query(query, (error, results, fields) => {
                if (error) {
                    reject(error);
                    return;
                }

                const columnNames = fields.map(field => field.name);
                const rows = results.map(result => unpackObject(result, columnNames));
                
                resolve({columnNames, rows});
            });
        });
    }

    close() {
        this.connection.destroy();
    }
}

module.exports = MySqlConnectionAdapter;
