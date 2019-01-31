const { TurnContext } = require('botbuilder');
const moment = require('moment');
const { getActivitys } = require('./userServices');
const { getUserIds } = require('./subscriptionsServices');

module.exports = {
    async autoDeployEvent ({ req, adapter }) {
        console.log('DeployEvent:', JSON.stringify(req.body));
        const {
            teamcityProperties,
            buildResult,
            buildName,
            buildStatusUrl
        } = req.body.build;
        const buildTarget = buildStatusUrl.match(/Box\d\d/g).toString().toLowerCase();
        const buildDate = teamcityProperties.find(p => p.name === 'build.formatted.timestamp').value;
        const changeMessage = teamcityProperties.find(p => p.name === 'ChangeMessage').value;

        const message = `${moment(buildDate).format('DD.MM.YYYY')} ${getStringBuildResult({ buildResult })} ${buildName} на ${buildTarget}` +
            `\n изменения: ${changeMessage}` +
            (buildResult === 'failed' ? `\n ${buildStatusUrl}` : '');

        console.log('buildTarget:', buildTarget);
        console.log('buildDate:', buildDate);
        console.log('changeMessage:', changeMessage);
        console.log('message:', message);

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
