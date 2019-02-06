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

    async removeAllTypeSubscriptions ({ userId, like }) {
        const user = await getUser({ userId });
        return removeByType({ userId: user.id, like });
    },

    async removeAllSubscriptions ({ userId }) {
        const user = await getUser({ userId });
        return remove({ userId: user.id });
    }
};

function save ({ userId, eventName }) {
    const sql = `insert into userssubscriptions (userId, eventName) values ('${userId}', '${eventName}')`;

    return query({ sqlString: sql });
}

function get ({ userId, eventName }) {
    let sql = `select * from userssubscriptions where 1 = 1`;
    userId && (sql += ` and userId = '${userId}'`);
    eventName && (sql += ` and eventName = '${eventName}'`);

    return query({ sqlString: sql });
}

function remove ({ userId, eventName }) {
    let sql = `delete from userssubscriptions where 1 = 1`;
    userId && (sql += ` and userId = '${userId}'`);
    eventName && (sql += ` and eventName = '${eventName}'`);

    return query({ sqlString: sql });
}

function removeByType ({ userId, like }) {
    let sql = `delete from userssubscriptions where 1 = 1`;
    userId && (sql += ` and userId = '${userId}'`);
    like && (sql += ` and eventName like '%${like}%'`);

    return query({ sqlString: sql });
}
