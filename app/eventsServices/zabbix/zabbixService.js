const { replaceHelp } = require('./../../utils');
const { isValidName, getApps } = require('./zabbixAppName');
const { getUser } = require('./../../dao/userServices');
const { sendMessage } = require('./../../dialogServices');
const { get, save, remove, removeAllType } = require('./../../dao/subscriptionsServices');

const eventRegx = /zabbix_\S+/i;
const eventPrefix = `zabbix_`;

const helpRegx = /help_zabbix/i;
const listRegx = /list_zabbix/i;
const getAppRegx = /get_zabbix/i;
const addRegx = /add_zabbix_\S+/i;
const removeRegx = /remove_zabbix_\S+/i;
const removeAllRegx = /remove_all_zabbix/i;

module.exports = {
    getHelpMessage () {
        return `${replaceHelp(helpRegx)} - помощь раздела zabbix`
    },

    getListMessage ({ userId }) {
        return getListMessage({ userId });
    },

    async search ({ context, userId, message }) {
        if (message.search(helpRegx) === 0) {
            await context.sendActivity(getHelpMessage());
            return true;
        }

        if (message.search(listRegx) === 0) {
            await context.sendActivity(await getListMessage({ userId }));
            return true;
        }

        if (message.search(getAppRegx) === 0) {
            await context.sendActivity(await getAppListMessage());
            return true;
        }

        if (message.search(addRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            const appName = eventName.replace(eventPrefix, '');
            const validApp = await isValidName(appName);

            if (!validApp) {
                await context.sendActivity(`Имя приложения [${appName}] не валидно. Подписка не создана`);
                return true;
            }

            const user = await getUser({ userId });
            const subscription = await get({ userId: user.id, eventName });
            if (subscription && subscription.length) {
                await context.sendActivity(`Подписка на приложение ${validApp.name} уже существует`);
                return true;
            }

            await save({ userId, eventName });
            await context.sendActivity(`Включена подписка на приложение ${validApp.name}`);
            return true;
        }

        if (message.search(removeRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            const subscription = await get({ userId, eventName });

            if (!subscription && !subscription.length) {
                await context.sendActivity(`Подписки на приложение ${eventName} не существует`);
                return true;
            }

            await remove({ userId, eventName });
            await context.sendActivity(`Удалена подписка на событие ${eventName}`);
            return true;
        }

        if (message.search(removeAllRegx) === 0) {
            await removeAllType({ userId, eventPrefix });
            await context.sendActivity(`Удалена подписка на все события с перфиксом ${eventPrefix}`);
            return true;
        }

        return false;
    },

    async event ({ req }) {
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

async function getAppListMessage () {
    const { mainApp } = await getApps();
    return `Список событий zabbix:\n` +
        mainApp.map(app => `-- ${app}`).sort().join(`\n`) +
        `\n\nдля подписания на все приложения, используйте **all** как имя приложения`
}

async function getListMessage ({ userId }) {
    const user = await getUser({ userId });
    const subscriptions = await get({ userId: user.id, eventPrefix });

    const list = subscriptions && subscriptions.length
        ? subscriptions.map(s => `-- ${s.eventName.replace(eventPrefix, '')}`).sort().join(`\n`)
        : `Нет действующих подписок`;

    return `**Подписки на события zabbix**:\n${list}`;
}

function getHelpMessage () {
    return `Подсказка для раздела **zabbix**:\n` +
        `Раздел этого бота предназначен для управения подписками из zabbix\n` +
        `\n` +
        `**Оповещения приходят о таких событиях как**:\n` +
        `*Частый перезапуск Application Pool на каждой ноде с IIS*\n` +
        `*Application Pool не запущен*\n` +
        `*Сайт на IIS не запущен*\n` +
        `*Недоступность приложения на балансировщике*\n` +
        `\n` +
        `**Список команд**:\n` +
        `${replaceHelp(helpRegx)} - подсказка раздела\n` +
        `${replaceHelp(listRegx)} - список действующих подписок\n` +
        `${replaceHelp(getAppRegx)} - показать все доступные приложения\n` +
        `${replaceHelp(addRegx).replace(/\\S\+/, `{AppName из zabbix}`)} - подписаться на получени событий для конкретного приложения\n` +
        `${replaceHelp(removeRegx).replace(/\\S\+/, `{AppName из zabbix}`)} - удалить подписку на события конкретного приложения\n` +
        `${replaceHelp(removeAllRegx)} - удалить подписку на все события из zabbix\n`
}
