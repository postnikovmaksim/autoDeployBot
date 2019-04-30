const { replaceHelp } = require('./../../utils');
const { isValidName, getApps } = require('./newrelicAppName');
const { sendMessage } = require('./../../dialogServices');
const { getUser } = require('./../../dao/userServices');
const { get, save, remove, removeAllType } = require('./../../dao/subscriptionsServices');

const eventRegx = /newrelic_\S+/i;
const eventPrefix = `newrelic_`;

const helpRegx = /help_newrelic/i;
const listRegx = /list_newrelic/i;
const getAppRegx = /get_newrelic/i;
const addRegx = /add_newrelic_\S+/i;
const removeRegx = /remove_newrelic_\S+/i;
const removeAllRegx = /remove_all_newrelic/i;

module.exports = {
    getHelpMessage () {
        return `${replaceHelp(helpRegx)} - помощь раздела newrelic`
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
                await context.sendActivity(`Имя приложения **${appName}** не валидно. Подписка не создана`);
                return true;
            }

            const user = await getUser({ userId });
            const subscription = await get({ userId: user.id, eventName });
            if (subscription && subscription.length) {
                await context.sendActivity(`Подписка на приложение **${validApp.name}** уже существует`);
                return true;
            }

            await save({ userId, eventName });
            await context.sendActivity(`Включена подписка на приложение **${validApp.name}**`);

            return true;
        }

        if (message.search(removeRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            const subscription = await get({ userId, eventName });

            if (!subscription && !subscription.length) {
                await context.sendActivity(`Подписки на приложение **${eventName}** не существует`);
                return true;
            }

            await remove({ userId, eventName });
            await context.sendActivity(`Удалена подписка на приложение **${eventName}**`);
            return true;
        }

        if (message.search(removeAllRegx) === 0) {
            await removeAllType({ userId, eventPrefix });
            await context.sendActivity(`Удалена подписка на все события с перфиксом **${eventPrefix}**`);
            return true;
        }

        return false;
    },

    async event ({ req }) {
        const level = req.body.severity;
        const applicationName = req.body.targets[0].name;
        const details = req.body.details;
        const url = req.body.incident_url;

        const message = `${level} ${applicationName} ${details} ${url}`;

        sendMessage({ message, eventName: `${eventPrefix}${applicationName}` });
        sendMessage({ message, eventName: `${eventPrefix}all` });
    }
};

async function getAppListMessage () {
    const { mainApp, outApp } = await getApps();
    return `Список событий newrelic:\n` +
        `\n*org.moedelo*:\n` +
        mainApp.map(app => `-- ${app.name}`).sort().join(`\n`) +
        `\n\n*org.moedelo.out*:\n` +
        outApp.map(app => `-- ${app.name}`).sort().join(`\n`) +
        `\n\nдля подписания на все приложения, используйте **all** как имя приложения`
}

async function getListMessage ({ userId }) {
    const user = await getUser({ userId });
    const subscriptions = await get({ userId: user.id, eventPrefix });

    const list = subscriptions && subscriptions.length
        ? subscriptions.map(s => `-- ${s.eventName.replace(eventPrefix, '')}`).sort().join(`\n`)
        : `Нет действующих подписок`;

    return `**Подписки на события newrelic**:\n${list}`;
}

function getHelpMessage () {
    return `Подсказка для раздела **newrelic**:\n` +
        `Раздел этого бота предназначен для управения подписками из newrelic\n` +
        `\n` +
        `**Оповещения приходят о таких событиях как**:\n` +
        `*Apdex < 0.8 for at least 5 mins*\n` +
        `*Apdex < 1 for at least 5 mins*\n` +
        `*Error percentage > 2 % for at least 5 mins*\n` +
        `\n` +
        `**Список команд**:\n` +
        `${replaceHelp(helpRegx)} - подсказка раздела\n` +
        `${replaceHelp(listRegx)} - список действующих подписок\n` +
        `${replaceHelp(getAppRegx)} - показать все доступные приложения\n` +
        `${replaceHelp(addRegx).replace(/\\S\+/, `{AppName из newrelic}`)} - подписаться на получени событий для конкретного приложения\n` +
        `${replaceHelp(removeRegx).replace(/\\S\+/, `{AppName из newrelic}`)} - удалить подписку на события конкретного приложения\n` +
        `${replaceHelp(removeAllRegx)} - удалить подписку на все события из newrelic\n`
}
