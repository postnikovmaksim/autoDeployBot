const { query } = require('./mysqlServices');
const { getUser } = require('./userServices');

module.exports = {
    async save ({ userId, eventName }) {
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

    async get ({ userId, eventName, eventPrefix }) {
        return get({ userId, eventName, eventPrefix });
    },

    async remove ({ userId, eventName }) {
        const user = await getUser({ userId });
        return remove({ userId: user.id, eventName });
    },

    async removeAllType ({ userId, eventPrefix }) {
        const user = await getUser({ userId });
        return removeByType({ userId: user.id, eventPrefix });
    },

    async removeAll ({ userId }) {
        const user = await getUser({ userId });
        return remove({ userId: user.id });
    }
};

function save ({ userId, eventName }) {
    if (!userId || !eventName) {
        console.log(`Ошибка подписки на событие userId=${userId} eventName=${eventName}`);
        return;
    }

    const sql = `insert into users_subscriptions_test 
                (user_id, event_name) 
                values ('${userId}', '${eventName}')`;
    return query({ sqlString: sql });
}

function get ({ userId, eventName, eventPrefix }) {
    let sql = `select id,
                user_id as userId,
                event_name as eventName
                from users_subscriptions_test 
                where 1 = 1`;
    userId && (sql += ` and user_id = '${userId}'`);
    eventName && (sql += ` and event_name = '${eventName}'`);
    eventPrefix && (sql += ` and event_name like '${eventPrefix}%'`);

    return query({ sqlString: sql });
}

function remove ({ userId, eventName }) {
    if (!userId) {
        console.log(`Ошибка подписки на событие userId=${userId} eventName=${eventName}`);
        return;
    }

    let sql = `delete 
                from users_subscriptions_test 
                where 1 = 1`;
    userId && (sql += ` and user_id = '${userId}'`);
    eventName && (sql += ` and event_name = '${eventName}'`);

    return query({ sqlString: sql });
}

function removeByType ({ userId, eventPrefix }) {
    if (!userId || !eventPrefix) {
        console.log(`Ошибка удаления по типу userId=${userId} eventPrefix=${eventPrefix}`);
        return;
    }

    let sql = `delete 
                from users_subscriptions_test 
                where 1 = 1`;
    userId && (sql += ` and user_id = '${userId}'`);
    eventPrefix && (sql += ` and event_name like '${eventPrefix}%'`);

    return query({ sqlString: sql });
}
