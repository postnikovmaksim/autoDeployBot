const { adapter } = require('./../../botFrameworkServices');
const { getReference, updateReference } = require('./../userServices');
const { asyncForEach } = require('./../utils');
const { query } = require('./../mysqlServices');

//todo да, пока копипаста
module.exports = { 
    sendToChannels: async function ({ message, eventName }) {
        const userIds = await getIds({ eventName });
        if (!userIds.length) {
            return;
        }
        
        const reference = await getReference({ ids: userIds });
        asyncForEach(reference, async reference => {
            await adapter.continueConversation(reference, async (context) => {
                try {
                    const reply = await context.sendActivity(message);
                    updateReference({ context, reply });
                } catch (e) {
                    console.log(e);
                }
            })
        })
    }
}


async function getIds({ eventName }) {
    const userIds = await getUserIds({ eventName });
    return userIds.map(u=> u.id);
}


async function getUserIds({ eventName }) {
    let sql = `select distinct(u.id) from messenger_bot.channelssubscriptions cs
                    join channelsusers cu on cu.channelId = cs.channelId
                    join users u on cu.UserId = u.Id
                    where cs.eventName = '${eventName}';
                                           and u.Id not in (SELECT us.userId FROM messenger_bot.userssubscriptions as us
                                            join users as u on u.id = us.userId
                                            where us.eventName = '${eventName}');`; //исключаем тех пользователей, которые уже подписаны на это событие, хз, может не оч

    return query({ sqlString: sql });
}