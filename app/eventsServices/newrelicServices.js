const newrelicAppName = require('./../eventsName/newrelicAppName');
const { sendMessage } = require('../dialogServices');
const { saveSubscriptions, removeSubscriptions, removeAllTypeSubscriptions } = require('../subscriptionsServices');

const addRegx = /\\add_newrelic_\S+/;
const removeRegx = /\\remove_newrelic_\S+/;
const removeAllRegx = /\\remove_all_newrelic\S+/;
const eventRegx = /newrelic_\S+/;

module.exports = {
    async search ({ context, userId, message }) {
        if (message.search(addRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            const appName = message.match(eventRegx)[0].replace('newrelic_', '');

            if (newrelicAppName.isValidName(appName)) {
                await saveSubscriptions({ userId, eventName });
                await context.sendActivity(`Включена подписка на событие ${eventName}`);
            } else {
                await context.sendActivity(`Имя [${appName}] не валидно. Подписка не создана`);
            }

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

    async newrelicEvent ({ req }) {
        const level = req.body.severity;
        const applicationName = req.body.targets[0].name;
        const details = req.body.details;
        const url = req.body.incident_url;

        const message = `${level} ${applicationName} ${details} ${url}`;

        sendMessage({ message, eventName: `newrelic_${applicationName}` });
        sendMessage({ message, eventName: `newrelic_all` });
    }
};
