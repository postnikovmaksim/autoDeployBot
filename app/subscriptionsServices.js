const { query } = require('./mysqlServices');
const { getUser } = require('./userServices');

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
    },

    async getSubscriptions ({ userId }) {
        const result = await get({ userId });
        return result.map(r => r.eventName);
    },

    async removeSubscriptions ({ userId, eventName }) {
        const user = await getUser({ userId });
        return remove({ userId: user.id, eventName });
    },

    async removeAllTypeSubscriptions ({ userId, regx }) {
        const user = await getUser({ userId });
        return removeByType({ userId: user.id, regx });
    },

    async removeAllSubscriptions ({ userId }) {
        const user = await getUser({ userId });
        return remove({ userId: user.id });
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

function remove ({ userId, eventName }) {
    let sql = `DELETE FROM UsersSubscriptions WHERE 1 = 1`;
    userId && (sql += ` AND userId = '${userId}'`);
    eventName && (sql += ` AND eventName = '${eventName}'`);

    return query({ sqlString: sql });
}

function removeByType ({ userId, regx }) {
    let sql = `DELETE FROM UsersSubscriptions WHERE 1 = 1`;
    userId && (sql += ` AND userId = '${userId}'`);
    regx && (sql += ` AND eventName REGEXP '${regx}'`);

    return query({ sqlString: sql });
}
