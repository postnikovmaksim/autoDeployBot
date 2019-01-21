const mysql = require('async-mysql');

module.exports = {
    async query ({ sqlString }) {
        const connection = await mysql.connect(getConfig());
        const result = await connection.query(sqlString);
        await connection.end();
        return result;
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
        host: 'localhost',
        user: 'root',
        password: 'moedelo',
        database: 'messenger_bot'
    }
}
