const moment = require('./../../libs/moment');
const { sendMessage } = require('./../../dialogServices');

const eventPrefix = 'deploy_';

module.exports = {
    async event ({ req }) {
        const { boxSelector, buildName, changes } = req.body;
        const timestamp = moment().format('DD.MM.YYYY HH:mm');

        let message = `${timestamp} успешно выложен ${buildName} на ${boxSelector}`;
        changes && (message += getChanges({ changesBase64: changes }));

        sendMessage({ message, eventName: `${eventPrefix}${boxSelector}` });
    }
};

function getChanges ({ changesBase64 }) {
    const changes = JSON.parse(new Buffer.from(changesBase64, 'base64').toString('utf8'));
    return `\n изменения:\n${Array.isArray(changes)
        ? changes.map(change => format(change)).join(`\n`)
        : format(changes)
    }`;
}

function format (change) {
    const text = change.search(/\n\n*/) >= 0
        ? change.match(/.+\n\n*/)[0].replace(/\n\n*/, '')
        : change.replace(/\n/, '');

    return `-- ${text}`
}
