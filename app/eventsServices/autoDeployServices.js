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
        const { boxSelector, buildName, changes } = req.body;
        const timestamp = moment().add(3, 'hour').format('DD.MM.YYYY HH:mm');

        let message = `${timestamp} успешно выложен ${buildName} на ${boxSelector}`;
        changes && (message += getChanges({ changesBase64: changes }));

        sendMessage({ message, eventName: `deploy_${boxSelector}` });
    }
};

function getChanges ({ changesBase64 }) {
    const changes = JSON.parse(new Buffer.from(changesBase64, 'base64').toString('utf8'));
    return `\n изменения:\n${Array.isArray(changes)
        ? changes.map(change => format(change)).join(`\n`)
        : format(changes)
    }`;
}

function format ({ change }) {
    const text = change.search(/\n\n*/) >= 0
        ? change.match(/.+\n\n*/)[0].replace(/\n\n*/, '')
        : change.replace(/\n/, '');

    return `-- ${text}`
}
