const { query } = require('./mysqlServices');
const { sendMessage } = require('../dialogServices');

module.exports = {
    async getChannels () {
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

    async getChannelIdByName({ channelName }) {
        const result = await getChannelIdByName({ channelName });
        if (result && result.length) {
            console.log(result);
            return result[0].id;
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

    async isChannelExists({ id, name }) {
        const count = await getCount({ id, name });
        return count && count.length && count[0].count;
    },

    async getUserIds({ eventName }) {
        const userIds = await getUserIds({ eventName });
        return userIds.map(u=> u.userId);
    }
};

function getAll () {
    let sql = `select Id, Name from channels`;
    return query({ sqlString: sql });
}

function createChannel({ channelName }) {
    let sql = `insert into channels (Name) values ('${channelName}')`;
    return query({ sqlString: sql});
}

function subscribeById({ channelId, userId }) {
    let sql = `insert ignore into channelsusers (channelId, userId) value (${channelId}, ${userId})`;
    return query({sqlString: sql});
}

function getChannelIdByName({ channelName }) {
    let sql = `select id from channels where Name = '${channelName}' limit 1`;
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

function getCount({ id, name }) {
    let sql = `select count(1) as count from channels where 1=1`;
    id && id > 0 && (sql += ` and id = ${id}`);
    name && name.length && (sql += ` and Name = ${name}`);

    return query({ sqlString: sql });
}

function getUserIds({ eventName }) {
    let sql = `select * from messenger_bot.channelssubscriptions cs
                    join channelsusers cu on cu.channelId = cs.channelId
                    join users u on cu.UserId = u.Id
                    where cs.eventName = ${eventName};`;

    return query({ sqlString: sql });
}