const { TurnContext } = require('botbuilder');
const { getActivitys } = require('./userService');
const { getUserIds } = require('./subscriptionsServices');

module.exports = {
    async deployEvent ({ req, adapter }) {
        const buildResult = req.body.build_result;
        const buildName = req.body.build_name;
        const buildTarget = req.body.build_status_url.match(/Box\d\d/g).toString().toLowerCase();

        const ids = await getUserIds({ eventName: `deploy_${buildTarget}` });
        const activitys = await getActivitys({ ids });
        console.log(activitys);
        activitys.forEach(async activity => {
            const reference = TurnContext.getConversationReference(activity);
            await adapter.continueConversation(reference, async (context) => {
                await context.sendActivity(`${buildResult} deploy ${buildName} on ${buildTarget}`);
            })
        })
    }
};
