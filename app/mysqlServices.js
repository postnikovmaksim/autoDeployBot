const mysql = require('async-mysql');

const host = 'sql7.freesqldatabase.com';
const user = 'sql7274473';
const password = 'hpRtviZyvA';
const database = 'sql7274473';

let connection;

module.exports = {
    async query ({ sqlString }) {
        if (!connection) {
            connection = await mysql.connect(getConfig());
        }
        console.log(sqlString);
        return connection.query(sqlString);
    }
};

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
        host: 'sql7.freesqldatabase.com',
        user: 'sql7274473',
        password: 'hpRtviZyvA',
        database: 'sql7274473'
    }
}
