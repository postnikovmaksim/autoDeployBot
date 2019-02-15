const { adapter } = require('./../../botFrameworkServices');
const { getReference, updateReference } = require('./../userServices');
const { getUserIds } = require('./../subscriptionsServices');
const { asyncForEach } = require('./../utils');

module.exports = {
    async newrelicEvent ({ req }) {
        const level = req.body.severity;
        const applicationName = req.body.targets[0].name;
        const details = req.body.details;
        const url = req.body.incident_url;

        const ids = await getUserIds({ eventName: `newrelic_${applicationName}` });
        if (!ids.length) {
            return;
        }

        const message = `${level} ${applicationName} ${details} ${url}`;
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
};
