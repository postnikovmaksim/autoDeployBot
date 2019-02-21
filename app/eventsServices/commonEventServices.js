const { query } = require('../mysqlServices');

module.exports = {
    async saveEvent ({ name, date, json }) {
        await query({ sqlString: `insert into events (name, date, json) values ('${name}', '${date}', '${json}')` });
    }
};
