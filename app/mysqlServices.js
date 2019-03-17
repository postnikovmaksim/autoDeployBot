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
                    console.log(`Запрос выполнен успешно, найденно ${rows.length}`);
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
                console.log('При создании конекшена произошла ошибка', err);
                reject(new Error(err));
            } else {
                console.log('Соединение успешно установлено');
                resolve(connection);
            }
        });
    });
}

function getConfig () {
    if (process.env.NODE_ENV === 'production') {
        return {
            host: '148.251.238.183',
            port: '49265',
            user: 'user_skype',
            password: 'YMwTZAwhmJ0deC6I54q2SE9d',
            database: 'bot_skype'
        }
    }

    return {
        host: 'localhost',
        user: 'root',
        password: 'moedelo',
        database: 'messenger_bot'
    }
}
