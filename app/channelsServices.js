const { query } = require('./mysqlServices');


module.exports = {
    async getChannels() {
        return await getAll();
    },

    async createChannel({ channelName }) {
        await createChannel({ channelName });
    },

    async subscribeChannel({ channelId, userId }) {
        if (channelId && userId) {
            return await subscribeById({ channelId, userId });
        }
    },

    async unsubscribeChannelById({ channelId, userId }) {
        if (channelId && userId) {
            return await unsubscribeChannelById({ channelId, userId });
        }
    },

    async getSubscribedChannels({ userId }) {
        if (userId) {
            return await getSubscribedChannels({ userId });
        }
    },

    async getUserIds({ eventName }) {
        const userIds = await getUserIds({ eventName });
        return userIds.map(u => u.userId);
    },

    async get({ id, name }) {
        const channel = await get({ id, name });
        return channel;
    },

    async saveSubscription({ channelId, eventName }) {
        const subscription = await getSubsciption({ channelId, eventName });
        if (!subscription || !subscription.length) {
            await saveSub({ channelId, eventName });
        }
    }
};

function getAll() {
    let sql = `select Id, Name from channels`;
    return query({ sqlString: sql });
}

function createChannel({ channelName }) {
    let sql = `insert into channels (Name) values ('${channelName}')`;
    return query({ sqlString: sql });
}

function subscribeById({ channelId, userId }) {
    let sql = `insert ignore into channelsusers (channelId, userId) value (${channelId}, ${userId})`;
    return query({ sqlString: sql });
}

function unsubscribeChannelById({ channelId, userId }) {
    let sql = `delete from channelsusers where userId = ${userId} and channelId = ${channelId}`;
    return query({ sqlString: sql });
}

function getSubscribedChannels({ userId }) {
    let sql = `select ch.Id as Id, ch.Name as Name from channels ch 
                join channelsusers cu on cu.channelId = ch.id
                where cu.userId = ${userId} 
                order by ch.Id`;
    return query({ sqlString: sql });
}

function get({ id, name }) {
    let sql = `select Id, Name from channels where 1=1`;
    id && id > 0 && (sql += ` and id = ${id}`);
    name && (sql += ` and name = '${name}'`);

    return query({ sqlString: sql });
}

function getSubsciption({ channelId, eventName }) {
    let sql = `select channelId, eventName from channelsSubscriptions where channelId = ${channelId} and eventName = '${eventName}'`;
    return query({ sqlString: sql });
}

function saveSub({ channelId, eventName }) {
    let sql = `insert channelssubscriptions (channelId, eventName) value (${channelId}, '${eventName}')`

    return query({ sqlString: sql });
}