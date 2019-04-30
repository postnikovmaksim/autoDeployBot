const { replaceHelp } = require('./../utils');
const { sendMessage } = require('./../dialogServices');
const { getUser } = require('./../dao/userServices');
const { get, save, remove, removeAllType } = require('./../dao/subscriptionsServices');

const eventRegx = /custom_\S+/i;
const eventPrefix = `custom_`;

const helpRegx = /help_custom/i;
const listRegx = /list_custom/i;
const addRegx = /add_custom_\S+/i;
const removeRegx = /remove_custom_\S+/i;
const removeAllRegx = /remove_all_custom/i;

module.exports = {
    getHelpMessage () {
        return `${replaceHelp(helpRegx)} - помощь раздела custom`
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

        if (message.search(addRegx) === 0) {
            const eventName = message.match(eventRegx)[0];

            const subscription = await get({ userId, eventName });
            if (subscription && subscription.length) {
                await context.sendActivity(`Подписка на событие ${eventName} уже существует`);
                return true;
            }

            await save({ userId, eventName });
            await context.sendActivity(`Включена подписка на событие ${eventName}`);

            return true;
        }

        if (message.search(removeRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            const subscription = await get({ userId, eventName });

            if (!subscription && !subscription.length) {
                await context.sendActivity(`Подписки на событие ${eventName} не существует`);
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
        const { eventName, message } = req.body;

        if (eventName && message) {
            sendMessage({ message, eventName: `${eventPrefix}${eventName}` });
        }
    }
};

async function getListMessage ({ userId }) {
    const user = await getUser({ userId });
    const subscriptions = await get({ userId: user.id, eventPrefix });

    const list = subscriptions && subscriptions.length
        ? subscriptions.map(s => `-- ${s.eventName.replace(eventPrefix, '')}`).sort().join(`\n`)
        : `Нет действующих подписок`;

    return `**Подписки на custom события**:\n${list}`;
}

function getHelpMessage () {
    return `Подсказка для раздела **custom**:\n` +
        `\nРаздел этого бота предназначен для управения custom подписками. ` +
        `В рамках этого раздела можно подписаться на событие с произвольным названием. ` +
        `Для активации события необходимо прислать POST запрос на адрес https://mdnotification.azurewebsites.net/event/custom` +
        `, тело должно быть в формате JSON и содержать объект с двумя полями *{ eventName, message }*. ` +
        `Все пользователи, подписанные на событие c именем *eventName*, получат сообщение из поля *message*.\n` +
        `\n**Список команд**:\n` +
        `${replaceHelp(helpRegx)} - подсказка раздела\n` +
        `${replaceHelp(listRegx)} - список действующих подписок\n` +
        `${replaceHelp(addRegx).replace(/\\S\+/, `{название события}`)} - подписаться на получени событий\n` +
        `${replaceHelp(removeRegx).replace(/\\S\+/, `{название события}`)} - удалить подписку на события\n` +
        `${replaceHelp(removeAllRegx)} - удалить подписку на все события категории custom\n`
}
