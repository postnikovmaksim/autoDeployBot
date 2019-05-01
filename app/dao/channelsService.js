const { query } = require('./../dao/mysqlServices');

module.exports = {
    getChannels ({ id, name }) {
        let sql = `select 
                id, 
                name 
                from channels_test 
                where 1 = 1`;
        id && (sql += ` and id = '${id}'`);
        name && (sql += ` and name = '${name}'`);
        return query({ sqlString: sql });
    },

    createChannel ({ name }) {
        let sql = `insert into channels_test 
                (name) 
                values ('${name}')`;
        return query({ sqlString: sql });
    },

    subscribeChannel ({ channelId, userId }) {
        let sql = `insert into channels_users_test 
                (channel_id, user_id) 
                value (${channelId}, ${userId})`;
        return query({ sqlString: sql });
    },

    unsubscribeChannel ({ channelId, userId }) {
        let sql = `delete 
                from channels_users_test
                where channel_id = ${channelId}
                and user_id = ${userId}`;
        return query({ sqlString: sql });
    },

    getChannelsByUser ({ userId, name }) {
        let sql = `select 
                ch.id as id, 
                ch.name as name 
                from channels_test as ch 
                join channels_users_test as cu on cu.channel_id = ch.id
                where cu.user_id = ${userId}`;
        name && (sql += ` and ch.name = '${name}'`);
        return query({ sqlString: sql });
    }
};
