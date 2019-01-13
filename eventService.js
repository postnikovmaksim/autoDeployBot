const { getUsers } = require('./userService');
const { TurnContext } = require('botbuilder');

module.exports = {
    async deployEvent ({ req, adapter }) {
        const buildResult = req.body.build_result;
        const buildName = req.body.build_name;
        const buildTarget = req.body.build_status_url.match(/Box\d\d/g).toString().toLowerCase();

        const users = await getUsers();
        users.filter(user => user.options && user.options.deploy && user.options.deploy[buildTarget])
            .forEach(async user => {
                const reference = TurnContext.getConversationReference(user.activity);
                await adapter.continueConversation(reference, async (context) => {
                    await context.sendActivity(`${buildResult} deploy ${buildName} on ${buildTarget}`);
                })
            })
    }
};
