const { query } = require('./mysqlServices');


module.exports = {
    async getChannels() {
        return await getAll();
    },

    async createChannel({ channelName }) {
        if (!channelName) {
            throw new Error("createChannel: channelName can't be null");
        }

        return await createChannel({ channelName });
    },

    async subscribeChannel({ channelId, userId }) {
        if (!channelId || !userId) {
            new Error("subscribeChannel: channelId or userId can't be null");
        }

        return await subscribeById({ channelId, userId });
    },

    async unsubscribeChannelById({ channelId, userId }) {
        if (!channelId || !userId) {
            throw new Error("unsubscribeChannelById: channelId or userId can't be null");
        }

        return await unsubscribeChannelById({ channelId, userId });
    },

    async getSubscribedChannels({ userId }) {
        if (!userId) {
            new Error("getSubscribedChannels: userId can't be null");
        }

        return await getSubscribedChannels({ userId });
    },

    async get({ id, name }) {
        const channels = await get({ id, name });
        return channels;
    },

    async getChannel({ id, name }) {
        const result = await get({ id, name });
        if (result && result.length) {
            return result[0];
        }
    },

    async saveSubscription({ channelId, event }) {
        const subscription = await getSubsciption({ channelId, eventName: event });
        if (!subscription || !subscription.length) {
            await saveSub({ channelId, event });
        }
    },

    async getSubscribedEventsName({ channelId }) {
        const result = await getChannelSubsciptions({ channelId });

        return result.map(r => r.eventName);
    },

    async removeSubscription({ channelId, eventName }) {
        if (!channelId || !eventName) {
            throw new Error('removeSubscription: channelId or eventName cannot be null/undefined');
        }

        return await removeSubscription({ channelId, eventName });
    },

    async removeAllSubscriptionByType({ channelId, eventType }) {
        if (!channelId || !eventType) {
            throw new Error('removeAllSubscriptionByType: channelId or eventType cannot be null/undefined');
        }

        await removeByEventType({ channelId, eventType });
    },

    async getSubscribedUsersId({ eventName }) {
        const userIds = await getUserIds({ eventName });
        return userIds.map(u => u.id);
    },

    async deleteChannel({ channelId }) {
        if (!channelId) {
            throw new Error('deleteChannel: channelId cannot be null/undefined');
        }

        return await finallyDeleteChannel({ channelId });
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

//удаление через джоин не завелось :(
function finallyDeleteChannel({ channelId }) {
    let sql = ` delete from channelssubscriptions where channelId = ${channelId}; 
                delete from channelsusers where channelId = ${channelId};
                delete from channels where id = ${channelId}`;
    
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
    if (!channelId && !eventName) {
        throw new Error("ChannelId and eventName can't be undefined at the same time");
    }

    let sql = `select channelId, eventName from channelsSubscriptions where channelId = ${channelId} and eventName = '${eventName}'`;
    return query({ sqlString: sql });
}

function saveSub({ channelId, event }) {
    let sql = `insert channelssubscriptions (channelId, eventName) value (${channelId}, '${event}')`

    return query({ sqlString: sql });
}

function getChannelSubsciptions({ channelId }) {
    if (!channelId) {
        throw new Error("channelId cant be null/undefined");
    }
    let sql = `select channelId, eventName from channelssubscriptions where channelId = ${channelId}`

    return query({ sqlString: sql });
}

function removeSubscription({ channelId, eventName }) {
    let sql = `delete from channelsSubscriptions where channelId = ${channelId} and eventName = '${eventName}'`;

    return query({ sqlString: sql });
}

function removeByEventType({ channelId, eventType }) {
    let sql = `delete from channelsSubscriptions where channelId = ${channelId} and eventName like '${eventType}%'`;

    return query({ sqlString: sql });
}

function getUserIds({ eventName }) {
    let sql = `select distinct(u.id) from messenger_bot.channelssubscriptions cs
                    join channelsusers cu on cu.channelId = cs.channelId
                    join users u on cu.UserId = u.Id
                    where cs.eventName = '${eventName}';`;

    return query({ sqlString: sql });
}