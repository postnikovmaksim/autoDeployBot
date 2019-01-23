const { TurnContext } = require('botbuilder');
const moment = require('moment');
const { getActivitys } = require('./userServices');
const { getUserIds } = require('./subscriptionsServices');

module.exports = {
    async autoDeployEvent ({ req, adapter }) {
        const buildDate = moment(req.body.timestamp).format('hh:mm:ss DD.MM.YYYY').add('hours', 3);
        const buildResult = req.body.build_result;
        const buildName = req.body.build_name;
        const buildTarget = req.body.build_status_url.match(/Box\d\d/g).toString().toLowerCase();

        const ids = await getUserIds({ eventName: `deploy_${buildTarget}` });
        if (!ids.length) {
            return;
        }

        const activitys = await getActivitys({ ids });
        activitys.forEach(async activity => {
            const reference = TurnContext.getConversationReference(activity);
            await adapter.continueConversation(reference, async (context) => {
                try {
                    await context.sendActivity(`${buildDate} ${buildResult} deploy ${buildName} on ${buildTarget}`);
                } catch (e) {
                    console.log(e);
                }
            })
        })
    }
};
