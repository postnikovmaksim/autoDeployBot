const { TurnContext } = require('botbuilder');
const { query } = require('./mysqlServices');

module.exports = {
    async saveOrUpdateUser ({ context }) {
        const user = await this.getUser({ userId: context.activity.from.id });
        const reference = TurnContext.getConversationReference(context.activity);

        console.log('user', user);
        if (!user) {
            await saveUser({
                userId: context.activity.from.id,
                name: context.activity.from.name,
                activity: JSON.stringify(reference)
            })
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

    async getActivitys ({ ids }) {
        const result = await get({ ids });
        return result.map(r => JSON.parse(r.activity));
    }
};

function get ({ ids }) {
    let sql = 'select * from users where 1 = 1';
    ids && ids.length && (sql += ` and id in (${ids.join(',')})`);

    return query({ sqlString: sql })
}

async function getUser ({ userId }) {
    return query({ sqlString: `select * from users where userId = '${userId}'` });
}

async function saveUser ({ userId, name, activity }) {
    const sql = `insert into users (userId, userName, activity) values ('${userId}', '${name}', '${activity}')`;
    return query({ sqlString: sql });
}

async function updateUser ({ userId, name, activity }) {
    const sql = `update users set activity = '${activity}', userName = '${name}' where userId = '${userId}'`;
    return query({ sqlString: sql });
}
