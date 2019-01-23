const { TurnContext } = require('botbuilder');
const moment = require('moment');
const { getActivitys } = require('./userServices');
const { getUserIds } = require('./subscriptionsServices');
const { getCommitMessages } = require('./teamCityServices');

module.exports = {
    async autoDeployEvent ({ req, adapter }) {
        const buildDate = moment(req.body.timestamp).add(3, 'hours').format('hh:mm:ss DD.MM.YYYY');
        const buildResult = req.body.build_result;
        const buildName = req.body.build_name;
        const buildNumber = req.body.build_number;
        const buildStatusUrl = req.body.build_status_url;
        const buildTarget = buildStatusUrl.match(/Box\d\d/g).toString().toLowerCase();
        const commitMessages = await getCommitMessages({ buildNumber });

        const message = `${buildDate} ${getStringBuildResult({ buildResult })} ${buildName} на ${buildTarget}` +
            `\n изменения: ${commitMessages.join(', ')}` +
            buildResult === 'failed' ? `\n ${buildStatusUrl}` : '';

        const ids = await getUserIds({ eventName: `deploy_${buildTarget}` });
        if (!ids.length) {
            return;
        }

        const activitys = await getActivitys({ ids });
        activitys.forEach(async activity => {
            const reference = TurnContext.getConversationReference(activity);
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

function getStringBuildResult ({ buildResult }) {
    switch (buildResult) {
    case 'success' :
        return 'успешно выложен';
    case 'failed' :
        return 'произошла ошибка при выкладке';
    default :
        return '';
    }
}
