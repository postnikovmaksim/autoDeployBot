const { adapter } = require('./../botFrameworkServices');
const { getReference, updateReference } = require('./userServices');
const { getUserIds } = require('./subscriptionsServices');
const { asyncForEach } = require('./utils');

module.exports = {
    sendMessage: async function ({ message, eventName }) {
        const ids = await getUserIds({ eventName });
        if (!ids.length) {
            return;
        }

        const reference = await getReference({ ids });
        asyncForEach(reference, async reference => {
            await adapter.continueConversation(reference, async (context) => {
                try {
                    context.activity.textFormat = "markdown";
                    context.activity.type = "message";
                    context.activity.text = message;
                    const reply = await context.sendActivity(context.activity);
                    updateReference({ context, reply });
                } catch (e) {
                    console.log(e);
                }
            })
        })
    }
};
