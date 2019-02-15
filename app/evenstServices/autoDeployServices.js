const moment = require('moment');
const { adapter } = require('./../../botFrameworkServices');
const { getReference, updateReference } = require('./../userServices');
const { getUserIds } = require('./../subscriptionsServices');
const { asyncForEach } = require('./../utils');

module.exports = {
    async autoDeployEvent ({ req }) {
        const {
            teamcityProperties,
            buildResult,
            buildName,
            buildStatusUrl
        } = req.body.build;
        const buildTarget = teamcityProperties.find(p => p.name === 'BoxSelector').value;
        const buildDate = teamcityProperties.find(p => p.name === 'build.formatted.timestamp').value;
        const changeMessage = teamcityProperties.find(p => p.name === 'ChangeMessage').value;
        const timestamp = moment(buildDate).add(3, 'hour').format('DD.MM.YYYY HH:mm');

        const message = `${timestamp} ${getStringBuildResult({ buildResult })} ${buildName} на ${buildTarget}` +
            `\n изменения: ${new Buffer.from(changeMessage, 'base64').toString('utf8')}` +
            (buildResult === 'failed' ? `\n ${buildStatusUrl}` : '');

        console.log('message:', message);

        const ids = await getUserIds({ eventName: `deploy_${buildTarget}` });

        if (!ids.length) {
            return;
        }

        const reference = await getReference({ ids });
        asyncForEach(reference, async activity => {
            await adapter.continueConversation(activity, async (context) => {
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
