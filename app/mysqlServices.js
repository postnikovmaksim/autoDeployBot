const moment = require('moment');
const mysql = require('mysql');

let connection;
let dateCreateConnection;

module.exports = {
    async query ({ sqlString }) {
        console.log(sqlString);

        await createConnectionAsync();
        return new Promise((resolve, reject) => {
            connection.query(sqlString, async (err, rows) => {
                if (err) {
                    if (err.fatal) {
                        connection.end();
                        connection = null;
                    }
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
        if (connection && hasPassedTime()) {
            resolve(connection);
        } else {
            end();
            connection = mysql.createConnection(getConfig());
            connection.connect(err => {
                if (err) {
                    connection.end();
                    connection = null;
                    reject(new Error(err));
                } else {
                    dateCreateConnection = moment();
                    resolve(connection);
                }
            });
        }
    });
}

function end () {
    console.log('endConnection');
    connection && connection.end();
}

function hasPassedTime () {
    return moment(dateCreateConnection).add(10, 'seconds').isAfter(moment());
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
