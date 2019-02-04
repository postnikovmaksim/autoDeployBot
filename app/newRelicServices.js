const { getActivitys } = require('./userServices');
const { getUserIds } = require('./subscriptionsServices');

module.exports = {
    async newRelicEvent ({ req, adapter }) {
        const level = req.body.severity;
        const applicationName = req.body.targets[0].name;
        const details = req.body.details;
        const url = req.body.incident_url;

        const ids = await getUserIds({ eventName: `newRelic_${applicationName}` });
        if (!ids.length) {
            return;
        }

        const message = `${level} ${applicationName} ${details} ${url}`;
        console.log(message);
        const activitys = await getActivitys({ ids });
        activitys.forEach(async reference => {
            await adapter.continueConversation(reference, async (context) => {
                try {
                    await context.sendActivity(message);
                } catch (e) {
                    console.log(e);
                }
            })
        })
    }
};
