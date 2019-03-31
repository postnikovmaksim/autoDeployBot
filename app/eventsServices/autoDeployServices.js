const moment = require('moment');
const { sendMessage } = require('../dialogServices');
const { saveSubscriptions, removeSubscriptions, removeAllTypeSubscriptions } = require('../subscriptionsServices');

const addRegx = /\\add_deploy_\S+/;
const removeRegx = /\\remove_deploy_\S+/;
const removeAllRegx = /\\remove_all_deploy/;
const eventRegx = /deploy_\S+/;

module.exports = {
    async search ({ context, userId, message }) {
        if (message.search(addRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            await saveSubscriptions({ userId, eventName });
            await context.sendActivity(`Включена подписка на событие ${eventName}`);
            return true;
        }

        if (message.search(removeRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            await removeSubscriptions({ userId, eventName });
            await context.sendActivity(`Удалена подписка на событие ${eventName}`);
            return true;
        }

        if (message.search(removeAllRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            await removeAllTypeSubscriptions({ userId, like: 'deploy_' });
            await context.sendActivity(`Удалена подписка на событие ${eventName}`);
            return true;
        }

        return false;
    },

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

        sendMessage({ message, eventName: `deploy_${buildTarget}` });
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
