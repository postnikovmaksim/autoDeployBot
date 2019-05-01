const { query } = require('./../dao/mysqlServices');

module.exports = {
    addEvent ({ channelId, eventName }) {
        if (!channelId || !eventName) {
            console.log(`Ошибка добавления события в канал channelId=${channelId} eventName=${eventName}`);
            return;
        }

        let sql = `insert into channels_subscriptions_test 
                (channel_id, event_name) 
                value (${channelId}, '${eventName}')`;
        return query({ sqlString: sql });
    },

    removeEvent ({ channelId, eventName }) {
        if (!channelId || !eventName) {
            console.log(`Ошибка удаления события из канала channelId=${channelId} eventName=${eventName}`);
            return;
        }

        let sql = `delete 
                from channels_subscriptions_test 
                where channel_id = ${channelId} 
                and event_name = '${eventName}'`;
        return query({ sqlString: sql });
    },

    getEvents ({ channelId, eventName }) {
        let sql = `select 
                event_name as eventName 
                from channels_subscriptions_test 
                where 1 = 1`;
        channelId && (sql += ` and channel_id = '${channelId}'`);
        eventName && (sql += ` and event_name = '${eventName}'`);
        return query({ sqlString: sql });
    },

    async getUserIds ({ eventName }) {
        const result = await getUserIds({ eventName });
        return result.map(x => x.userId);
    }
};

function getUserIds ({ eventName }) {
    let sql = `select 
                distinct(cu.user_id) as userId
                from channels_subscriptions_test as cs
                join channels_users_test as cu on cu.channel_id = cs.channel_id
                where cs.event_name = '${eventName}'`;
    return query({ sqlString: sql });
}
