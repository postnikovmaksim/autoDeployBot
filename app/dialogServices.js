const { getReference, updateReference } = require('./dao/userServices');
const subscriptionsServices = require('./dao/subscriptionsServices');
const channelEventsService = require('./dao/channelEventsServices');
const { asyncForEach } = require('./utils');
const { saveError } = require('./dao/logService');

module.exports = {
    async sendMessage ({ message, eventName }) {
        const idsByEvent = await subscriptionsServices.getUserIds({ eventName }) || [];
        const idsByChannel = await channelEventsService.getUserIds({ eventName }) || [];

        if (!idsByEvent.length && !idsByChannel.length) {
            return;
        }

        const allIds = [...idsByEvent, ...idsByChannel];
        const allUniqIds = [...new Set(allIds)];

        await send({ message, ids: allUniqIds })
    },

    async sendMessageByUserId ({ message, id }) {
        await send({ message, ids: [id] })
    }
};

async function send ({ message, ids }) {
    const reference = await getReference({ ids });
    asyncForEach(reference, async reference => {
        try {
            await process.adapter.continueConversation(reference, async (context) => {
                const reply = await context.sendActivity(message);
                updateReference({ context, reply });
            })
        } catch (error) {
            saveError({ url: `dialogService`, error });
        }
    });
}
