const { TurnContext } = require('botbuilder');

module.exports = {
    async deployEvent ({ req, activity, adapter }) {
        const reference = TurnContext.getConversationReference(activity);
        await adapter.continueConversation(reference, async (context) => {
            const buildResult = req.body.build_result;
            const buildName = req.body.build_name;
            const buildTarget = req.body.build_status_url.match(/Box\d\d/g).toString();

            await context.sendActivity(`${buildResult} deploy ${buildName} on ${buildTarget}`);
        })
    }
};
