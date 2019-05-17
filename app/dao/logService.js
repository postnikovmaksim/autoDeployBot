const moment = require('./../libs/moment');
const { queryWithParams } = require('./mysqlServices');

module.exports = {
    async saveRequest ({ url, json = '' }) {
        await queryWithParams({
            sqlString: `insert into requests 
                        (url, date, json) 
                        values ('${url}', '${getDate()}', ?)`,
            values: [json]
        });
    },

    async saveError ({ url, error }) {
        const json = JSON.stringify({
            message: error.message,
            stack: error.stack
        });

        await queryWithParams({
            sqlString: `insert into errors 
                        (url, date, json) 
                        values ('${url}', '${getDate()}', ?)`,
            values: [json]
        });
    }
};

function getDate () {
    return moment().format('YYYY-MM-DD HH:mm:ss')
}
