const { TurnContext } = require('botbuilder');
const { getActivitys } = require('./userServices');
const { getUserIds } = require('./subscriptionsServices');

module.exports = {
    async newRelicEvent ({ req, adapter }) {
        console.log(req.body);

        const level = req.body.severity;
        const applicationName = req.body.targets.name;
        const details = req.body.details;
        const url = req.body.incident_url;

        const ids = await getUserIds({ eventName: `newRelic_${applicationName}` });
        if (!ids.length) {
            return;
        }

        const activitys = await getActivitys({ ids });
        activitys.forEach(async activity => {
            console.log(1);
            const reference = TurnContext.getConversationReference(activity);
            await adapter.continueConversation(reference, async (context) => {
                await context.sendActivity(`${level} ${applicationName} ${details} ${url}`);
            })
        })
    }
};
