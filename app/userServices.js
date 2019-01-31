const { TurnContext } = require('botbuilder');
const { query } = require('./mysqlServices');

module.exports = {
    async saveOrUpdateUser ({ context }) {
        const user = await getUser({ userId: context.activity.from.id });
        const reference = TurnContext.getConversationReference(context.request);

        console.log(context);

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

    getUser ({ userId }) {
        return getUser({ userId });
    },

    async getActivitys ({ ids }) {
        const result = await get({ ids });
        return result.map(r => JSON.parse(r.activity));
    }
};

function get ({ ids }) {
    let sql = 'SELECT * FROM Users WHERE 1 = 1';
    ids && ids.length && (sql += ` AND id IN (${ids.join(',')})`);

    return query({ sqlString: sql })
}

async function getUser ({ userId }) {
    return query({ sqlString: `select * from Users where userId = '${userId}'` });
}

async function saveUser ({ userId, name, activity }) {
    const sql = `INSERT INTO Users (userId, userName, activity) VALUES ('${userId}', '${name}', '${activity}')`;
    return query({ sqlString: sql });
}

async function updateUser ({ userId, name, activity }) {
    const sql = `update Users set activity = '${activity}', userName = '${name}' where userId = '${userId}')`;
    return query({ sqlString: sql });
}
