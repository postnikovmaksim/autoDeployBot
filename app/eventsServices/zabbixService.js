const zabbixAppName = require('./../eventsName/zabbixAppName');
const { sendMessage } = require('../dialogServices');
const { saveSubscriptions, removeSubscriptions, removeAllTypeSubscriptions } = require('../subscriptionsServices');

const addRegx = /\\add_zabbix_\S+/;
const removeRegx = /\\remove_zabbix_\S+/;
const removeAllRegx = /\\remove_all_zabbix\S+/;
const eventRegx = /zabbix_\S+/;

module.exports = {
    async search ({ context, userId, message }) {
        if (message.search(addRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            const appName = message.match(eventRegx)[0].replace('zabbix_', '');

            if (zabbixAppName.isValidName(appName)) {
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

    async zabbixEvent ({ req }) {
        if (req.body.problemResolvedTime) {
            await zabbixOkEvent({ req });
        } else {
            await zabbixErrorEvent({ req });
        }
    }
};

async function zabbixErrorEvent ({ req }) {
    const {
        problemStarted,
        problemDate,
        problemName,
        host,
        severity,
        tags
    } = req.body;

    const aplicatonName = getAplicatonName(tags);
    const message = `[${aplicatonName}] Обнаружена проблема ${problemStarted} ${problemDate}: ${problemName}\n` +
    `host: ${host}, severity: ${severity}`;

    await sendMessage({ message, eventName: `zabbix_${aplicatonName}` });
    await sendMessage({ message, eventName: `zabbix_all` });
}

async function zabbixOkEvent ({ req }) {
    const {
        problemResolvedTime,
        problemResolvedDate,
        problemName,
        problemAge,
        host,
        severity,
        tags
    } = req.body;

    const aplicatonName = getAplicatonName(tags);
    const message = `[${aplicatonName}] Решена проблема (время существования проблемы ${problemAge})\n` +
        `дата создания проблемы: ${problemResolvedTime} ${problemResolvedDate}\n` +
        `сообщение проблемы: ${problemName}\n` +
        `host: ${host}, severity: ${severity}`;

    await sendMessage({ message, eventName: `zabbix_${aplicatonName}` });
    await sendMessage({ message, eventName: `zabbix_all` });
}

function getAplicatonName (tags) {
    return tags.match(/Application:\S+,/)[0].replace('Application:', '').replace(',', '');
}
