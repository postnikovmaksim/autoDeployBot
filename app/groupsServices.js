const { query } = require('./mysqlServices');
const { getUser } = require('./userServices');

module.exports = {
    async getGroups () {
        const groups = await getAll();
        return groups;
    }
};

function getAll () {
    let sql = `select Id, Name from messenger_bot.groups`;
    return query({ sqlString: sql });
}
