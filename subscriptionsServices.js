const { query } = require('./mysqlService');
const { getUser } = require('./userService');

module.exports = {
    async saveSubscriptions ({ userId, eventName }) {
        const user = await getUser({ userId });
        const events = await get({ userId: user.id, eventName });

        if (!events.length) {
            await save({ userId: user.id, eventName })
        }
    },

    async getUserIds ({ eventName }) {
        const result = await get({ eventName });
        return result.map(r => r.userId);
    }
};

function save ({ userId, eventName }) {
    const sql = `INSERT INTO UsersSubscriptions (userId, eventName) VALUES ('${userId}', '${eventName}')`;

    return query({ sqlString: sql });
}

function get ({ userId, eventName }) {
    let sql = `SELECT * FROM UsersSubscriptions WHERE 1 = 1`;
    userId && (sql += ` AND userId = '${userId}'`);
    eventName && (sql += ` AND eventName = '${eventName}'`);

    return query({ sqlString: sql });
}
