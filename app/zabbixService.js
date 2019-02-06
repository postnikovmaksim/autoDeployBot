const { getActivitys } = require('./userServices');
const { getUserIds } = require('./subscriptionsServices');

module.exports = {
    async zabbixEvent ({ req, adapter }) {
        const message = req.body.message;

        const ids = await getUserIds({ eventName: `zabbix` });
        if (!ids.length) {
            return;
        }

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
