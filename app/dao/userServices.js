const { TurnContext } = require('botbuilder');
const { query } = require('./mysqlServices');

module.exports = {
    async saveOrUpdateUser ({ context }) {
        const user = await getUser({ userId: context.activity.from.id });
        const reference = TurnContext.getConversationReference(context.activity);

        if (!user || !user.length) {
            const user = await getUser({ userName: context.activity.from.name });
            // ищем пользователя по имени. Для замены старого канала
            if (user && user.length && context.activity.from.name) {
                await updateUserByName({
                    userId: context.activity.from.id,
                    name: context.activity.from.name,
                    activity: JSON.stringify(reference)
                })
            } else {
                await saveUser({
                    userId: context.activity.from.id,
                    name: context.activity.from.name,
                    activity: JSON.stringify(reference)
                })
            }
        } else {
            await updateUser({
                userId: context.activity.from.id,
                name: context.activity.from.name,
                activity: JSON.stringify(reference)
            })
        }
    },

    async getUser ({ userId }) {
        const result = await getUser({ userId });
        return result[0];
    },

    async getReference ({ ids }) {
        const result = await get({ ids });
        return result.map(r => JSON.parse(r.activity));
    },

    async updateReference ({ context, reply }) {
        const reference = TurnContext.getReplyConversationReference(context.activity, reply);

        await updateUser({
            userId: context.activity.from.id,
            name: context.activity.from.name,
            activity: JSON.stringify(reference)
        })
    }
};

function get ({ ids }) {
    let sql = `select id,
                user_id as userId,
                user_name as userName,
                activity
                from users 
                where 1 = 1`;
    ids && ids.length && (sql += ` and id in (${ids.join(',')})`);
    return query({ sqlString: sql })
}

async function getUser ({ userId, userName }) {
    let sql = `select id,
                user_id as userId,
                user_name as userName,
                activity
                from users 
                 where 1 = 1`;
    userId && (sql += ` and user_id = '${userId}'`);
    userName && (sql += ` and user_name = '${userName}'`);
    return query({ sqlString: sql });
}

async function saveUser ({ userId, name, activity }) {
    const sql = `insert into users 
                (user_id, user_name, activity) 
                values ('${userId}', '${name}', '${activity}')`;
    return query({ sqlString: sql });
}

async function updateUser ({ userId, name, activity }) {
    const sql = `update users set 
                activity = '${activity}', 
                user_name = '${name}' 
                where user_id = '${userId}'`;
    return query({ sqlString: sql });
}

async function updateUserByName ({ userId, name, activity }) {
    const sql = `update users set 
                user_id = '${userId}',
                activity = '${activity}'
                where user_name = '${name}'`;
    return query({ sqlString: sql });
}
