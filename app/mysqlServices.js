const mysql = require('mysql');

let connection = null;
let count = 0;

module.exports = {
    async query ({ sqlString }) {
        await createConnectionAsync();
        return queryAsync(sqlString);
    }
};

function createConnectionAsync () {
    return new Promise((resolve, reject) => {
        if (connection) return;

        connection = mysql.createConnection(getConfig());
        connection.connect(async err => {
            if (err) {
                console.log(err);
                await reconnect(resolve, reject, err);
            } else {
                count = 0;
                resolve(connection);
            }
        });
    });
}

function queryAsync (sqlString) {
    return new Promise((resolve, reject) => {
        connection.query(sqlString, async (err, rows) => {
            if (err) {
                if (err.fatal) {
                    await reconnect(resolve, reject, err);
                }
                reject(new Error(err));
            } else {
                resolve(rows);
            }
        });
    });
}

async function reconnect (resolve, reject, err) {
    connection.end();
    connection = null;
    if (count < 3) {
        resolve(await createConnectionAsync());
    } else {
        count = 0;
        reject(new Error(err));
    }
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
