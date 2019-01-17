const mysql = require('async-mysql');

const host = 'sql7.freesqldatabase.com';
const user = 'sql7274473';
const password = 'hpRtviZyvA';
const database = 'sql7274473';

module.exports = {
    async query ({ sqlString }) {
        const connection = await mysql.connect({
            host: host,
            user: user,
            password: password,
            database: database
        });

        return connection.query(sqlString);
    }
};
