const mysql = require('mysql');

module.exports = {
    async query ({ sqlString }) {
        console.log(sqlString);

        const connection = await createConnectionAsync();
        return new Promise((resolve, reject) => {
            connection.query(sqlString, async (err, rows) => {
                connection.end();
                if (err) {
                    reject(new Error(err));
                } else {
                    resolve(rows);
                }
            });
        });
    }
};

function createConnectionAsync () {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection(getConfig());
        connection.connect(err => {
            if (err) {
                reject(new Error(err));
            } else {
                resolve(connection);
            }
        });
    });
}

function getConfig () {
    if (process.env.NODE_ENV === 'production') {
        return {
            host: 'sql7.freesqldatabase.com',
            user: 'sql7274473',
            password: 'hpRtviZyvA',
            database: 'sql7274473'
        }
    }

    return {
        host: 'localhost',
        user: 'root',
        password: 'moedelo',
        database: 'messenger_bot'
    }
}
