const { adapter } = require('./../botFrameworkServices');
const { getReference, updateReference, getUser } = require('./userServices');
const subscriptionsServices = require('./subscriptionsServices');
const channelsServices = require('./channelsServices');
const { asyncForEach } = require('./utils');

module.exports = {
    async sendMessage ({ message, eventName }) {
        const idsByEvent = await subscriptionsServices.getUserIds({ eventName }) || [];
        const idsByChannel = await channelsServices.getUserIds({ eventName }) || [];

        if (!idsByEvent.length && !idsByChannel.length) {
            return;
        }

        const allIds = [...idsByEvent, ...idsByChannel];
        const allUniqIds = [...new Set(allIds)];

        const reference = await getReference({ ids: allUniqIds });
        asyncForEach(reference, async reference => {
            await adapter.continueConversation(reference, async (context) => {
                try {
                    const reply = await context.sendActivity(message);
                    updateReference({ context, reply });
                } catch (e) {
                    console.log(e);
                }
            })
        });
    }
};
