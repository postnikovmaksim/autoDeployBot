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

    async getSubscriptions ({ userId, eventPrefix }) {
        return get({ userId, eventPrefix });
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
    const sql = `insert into users_subscriptions 
                (user_id, event_name) 
                values ('${userId}', '${eventName}')`;
    return query({ sqlString: sql });
}

function get ({ userId, eventName, eventPrefix }) {
    let sql = `select id,
                user_id as userId,
                event_name as eventName
                from users_subscriptions 
                where 1 = 1`;
    userId && (sql += ` and user_id = '${userId}'`);
    eventName && (sql += ` and event_name = '${eventName}'`);
    eventPrefix && (sql += ` and event_name like '${eventPrefix}%'`);

    return query({ sqlString: sql });
}

function remove ({ userId, eventName }) {
    let sql = `delete 
                from users_subscriptions 
                where 1 = 1`;
    userId && (sql += ` and user_id = '${userId}'`);
    eventName && (sql += ` and event_name = '${eventName}'`);

    return query({ sqlString: sql });
}

function removeByType ({ userId, like }) {
    let sql = `delete 
                from users_subscriptions 
                where 1 = 1`;
    userId && (sql += ` and user_id = '${userId}'`);
    like && (sql += ` and event_name like '%${like}%'`);

    return query({ sqlString: sql });
}
