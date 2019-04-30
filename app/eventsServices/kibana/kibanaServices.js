const moment = require('./../../libs/moment');
const { replaceHelp, asyncForEach } = require('./../../utils');
const { isValidName, getApps } = require('./kibanaAppName');
const { sendMessage } = require('./../../dialogServices');
const { getUser } = require('./../../dao/userServices');
const { get, save, remove, removeAllType } = require('./../../dao/subscriptionsServices');

const eventRegx = /kibana_\S+/i;
const eventPrefix = `kibana_`;

const helpRegx = /help_kibana/i;
const listRegx = /list_kibana/i;
const getAppRegx = /get_kibana/i;
const addRegx = /add_kibana_\S+/i;
const removeRegx = /remove_kibana_\S+/i;
const removeAllRegx = /remove_all_kibana/i;

module.exports = {
    getHelpMessage () {
        return `${replaceHelp(helpRegx)} - помощь раздела kibana`
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
                await context.sendActivity(`Имя приложения **${validApp.name}** не валидно. Подписка не создана`);
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

    async eventError ({ req }) {
        const { errorThreshold, repetitionRate, data } = req.body;

        asyncForEach(data, async ({ key, doc_count: docCount }) => {
            const message = `AppName: **${key}**\n` +
                `**Error** событий за последние ${moment.duration(repetitionRate, 'm').humanize()}: **${docCount}** (норма: до ${errorThreshold})\n`;

            await sendMessage({ message, eventName: `${eventPrefix}${key}` });
            await sendMessage({ message, eventName: `${eventPrefix}all` });
        });
    },

    async eventFatal ({ req }) {
        const { fatalThreshold, repetitionRate, data } = req.body;

        asyncForEach(data, async ({ key, doc_count: docCount }) => {
            const message = `AppName: **${key}**\n` +
                `**Fatal** событий за последние ${moment.duration(repetitionRate, 'm').humanize()}: **${docCount}** (норма: до ${fatalThreshold})\n`;

            await sendMessage({ message, eventName: `${eventPrefix}${key}` });
            await sendMessage({ message, eventName: `${eventPrefix}all` });
        });
    }
};

async function getAppListMessage () {
    // const { mainApp } = await getApps();
    return `Список событий kibana:\n` +
        `пока что список приложений неизвестно откуда брать, используйте названия по аналогии с newrelic\n` +
        // mainApp.map(app => `-- ${app.name}`).sort().join(`\n`) +
        `\n\nдля подписания на все приложения, используйте **all** как имя приложения`
}

async function getListMessage ({ userId }) {
    const user = await getUser({ userId });
    const subscriptions = await get({ userId: user.id, eventPrefix });

    const list = subscriptions && subscriptions.length
        ? subscriptions.map(s => `-- ${s.eventName.replace(eventPrefix, '')}`).sort().join(`\n`)
        : `Нет действующих подписок`;

    return `**Подписки на события kibana**:\n${list}`;
}

function getHelpMessage () {
    return `Подсказка для раздела **kibana**:\n` +
        `Раздел этого бота предназначен для управения подписками из kibana\n` +
        `\n` +
        `В рамках мониторинга здоровья приложения, отслеживается количество событий в промежуток времени.` +
        `При преодалении порогового значения, будет прислано сообщение:\n` +
        `*AppName: EdmConsoleSync*\n` +
        `***Error** собыйтий за последние 2 минуты: 840*\n` +
        `***Fatal** собыйтий за последние 2 минуты: 132*\n` +
        `\n` +
        `**Список команд**:\n` +
        `${replaceHelp(helpRegx)} - подсказка раздела\n` +
        `${replaceHelp(listRegx)} - список действующих подписок\n` +
        `${replaceHelp(getAppRegx)} - показать все доступные приложения\n` +
        `${replaceHelp(addRegx).replace(/\\S\+/, `{AppName из kibana}`)} - подписаться на получени событий для конкретного приложения\n` +
        `${replaceHelp(removeRegx).replace(/\\S\+/, `{AppName из kibana}`)} - удалить подписку на события конкретного приложения\n` +
        `${replaceHelp(removeAllRegx)} - удалить подписку на все события из kibana\n`
}
