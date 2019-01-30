const mysql = require('mysql');

module.exports = {
    async query ({ sqlString }) {
        const connection = await createConnectionAsync();
        return new Promise((resolve, reject) => {
            console.log('Выполянем запрос', sqlString);
            connection.query(sqlString, async (err, rows) => {
                connection.end();
                if (err) {
                    console.log('При обращении к базе произошла ошибка', err);
                    reject(new Error(err));
                } else {
                    console.log('Запрос выполнен успешно', JSON.stringify(rows));
                    resolve(rows);
                }
            });
        });
    }
};

function createConnectionAsync () {
    return new Promise((resolve, reject) => {
        const config = getConfig();
        console.log('Настройки подключения', config);
        const connection = mysql.createConnection(getConfig());
        connection.connect(err => {
            if (err) {
                console.log('При создании конекшена, произошла ошибка', err);
                reject(new Error(err));
            } else {
                console.log('Соединение успешно установлено', err);
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
