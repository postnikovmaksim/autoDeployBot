const { replaceHelp } = require('./../../utils');
const { getUser } = require('./../../dao/userServices');
const { get, save, remove, removeAllType } = require('./../../dao/subscriptionsServices');

const eventRegx = /deploy_\S+/;
const eventPrefix = 'deploy_';

const helpRegx = /help_deploy$/i;
const listRegx = /list_deploy$/i;
const addRegx = /add_deploy_\S+$/i;
const removeRegx = /remove_deploy_\S+$/i;
const removeAllRegx = /remove_all_deploy_\S+$/i;

module.exports = {
    getHelpMessage () {
        return `${replaceHelp(helpRegx)} - помощь раздела deploy`
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

            const user = await getUser({ userId });
            const subscription = await get({ userId: user.id, eventName });
            if (subscription && subscription.length) {
                await context.sendActivity(`Подписка на событие **${eventName}** уже существует`);
                return true;
            }

            await save({ userId, eventName });
            await context.sendActivity(`Включена подписка на событие **${eventName}**`);
            return true;
        }

        if (message.search(removeRegx) === 0) {
            const eventName = message.match(eventRegx)[0];

            const user = await getUser({ userId });
            const subscription = await get({ userId: user.id, eventName });
            if (!subscription || !subscription.length) {
                await context.sendActivity(`Подписки на событие **${eventName}** не существует`);
                return true;
            }

            await remove({ userId, eventName });
            await context.sendActivity(`Удалена подписка на событие **${eventName}**`);
            return true;
        }

        if (message.search(removeAllRegx) === 0) {
            await removeAllType({ userId, eventPrefix });
            await context.sendActivity(`Удалена подписка на все события с перфиксом **${eventPrefix}**`);
            return true;
        }

        return false;
    }
};

async function getListMessage ({ userId }) {
    const user = await getUser({ userId });
    const subscriptions = await get({ userId: user.id, eventPrefix });

    const list = subscriptions && subscriptions.length
        ? subscriptions.map(s => `-- ${s.eventName.replace(eventPrefix, '')}`).sort().join(`\n`)
        : `Нет действующих подписок`;

    return `**Подписки на события deploy**:\n${list}`;
}

function getHelpMessage () {
    return `Подсказка для раздела **deploy**\n` +
        `События для этого раздела генерируются TeamCity в разделах:\n` +
        `autoDeploy - https://ci.moedelo.org/project.html?projectId=Net_Deploy_Auto&tab=projectOverview\n` +
        `stageDeploy - https://ci.moedelo.org/viewType.html?buildTypeId=Net_Deploy_Stage_Misc_FullDeployTest\n` +
        `\nСписок команд:\n` +
        `${replaceHelp(helpRegx)} - подсказка раздела\n` +
        `${replaceHelp(listRegx)} - список действующих подписок\n` +
        `${replaceHelp(addRegx).replace(/\\S\+/, `{box** или stage}`)} - подписаться на получение событий\n` +
        `${replaceHelp(removeRegx).replace(/\\S\+/, `{box** или stage}`)} - удалить подписку для на собыйтия`
}
