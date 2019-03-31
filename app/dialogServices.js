const { adapter } = require('./../botFrameworkServices');
const { getReference, updateReference } = require('./userServices');
const { getUserIds } = require('./subscriptionsServices');
const { asyncForEach } = require('./utils');
const { getSubscribedUsersId } = require('./channelsServices');

module.exports = {
    async sendMessage ({ message, eventName }) {
        const ids = await getUserIds({ eventName }) || [];
        const userIdsFromChannels = await getSubscribedUsersId({ eventName }) || [];

        if (!ids.length && !userIdsFromChannels.length) {
            return;
        }
        const allIds = [...ids, ...userIdsFromChannels];
        const allUniqIds = [...new Set(allIds)];

        await send({ message, ids: allUniqIds });
    },

    async sendMessageByUserId ({ message, userId }) {
        await send({ message, ids: [userId] });
    }
};

async function send ({ message, ids }) {
    const reference = await getReference({ ids });
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
