const moment = require('moment');
const { sendMessage } = require('../dialogServices');
const { sendToChannels } = require('./channelsSenderService');

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

        sendMessage({ message, eventName: `deploy_${buildTarget}` });
        sendToChannels({ message, eventName: `deploy_${buildTarget}` });
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
