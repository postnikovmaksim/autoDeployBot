const { query } = require('./mysqlServices');

module.exports = {
    async saveOrUpdateUser ({ activity }) {
        const users = await getUsers();
        const userExist = users && users.find(user => user.userId === activity.from.id);

        if (!userExist && activity) {
            await saveUser({
                userId: activity.from.id,
                name: activity.from.name,
                activity: { ...activity, text: '' }
            })
        } else {
            await updateUser({
                userId: activity.from.id,
                name: activity.from.name,
                activity: { ...activity, text: '' }
            })
        }
    },

    async getUser ({ userId }) {
        const result = await get({ userId });
        return result[0];
    },

    async getActivitys ({ ids }) {
        const result = await get({ ids });
        return result.map(r => JSON.parse(r.activity));
    }
};

function get ({ ids, userId }) {
    let sql = 'SELECT * FROM Users WHERE 1 = 1';
    ids && ids.length && (sql += ` AND id IN (${ids.join(',')})`);
    userId && (sql += ` AND userId = '${userId}'`);

    return query({ sqlString: sql })
}

async function getUsers () {
    return query({ sqlString: 'SELECT * FROM Users' });
}

async function saveUser ({ userId, name, activity }) {
    const act = JSON.stringify(activity).replace('\\', '');
    const sql = `INSERT INTO Users (userId, userName, activity) VALUES ('${userId}', '${name}', '${act}')`;
    return query({ sqlString: sql });
}

async function updateUser ({ userId, name, activity }) {
    const act = JSON.stringify(activity).replace('\\', '');
    const sql = `update Users set activity = '${act}', userName = '${name}' where userId = '${userId}'`;
    return query({ sqlString: sql });
}
