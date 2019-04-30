const { replaceHelp } = require('./../../utils');
const { getUser } = require('./../../dao/userServices');
const { getChannels, getChannelsByUser, createChannel, subscribeChannel, unsubscribeChannel } = require('./../../dao/channelsService');

const helpRegx = /help_channels$/i;
const listRegx = /list_channels$/;
const getChannelsRegx = /get_channels$/i;

const createRegx = /create_channel_(?<channelName>\S+)$/i;
const subscribeRegx = /subscribe_channel_((?<channelId>\d+)|(?<channelName>\S+))$/i;
const unsubscribeRegx = /unsubscribe_channel_((?<channelId>\d+)|(?<channelName>\S+))$/i;

module.exports = {
    getHelpMessage () {
        return `${replaceHelp(helpRegx)} - помощь раздела "каналалы оповещений"`
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

        if (message.search(getChannelsRegx) === 0) {
            const channels = await getChannels({});
            const text = !channels || !channels.length
                ? `Ни одного канала не найдено. Создайте первый`
                : channels.map(c => `id: ${c.id} name: ${c.name}`).join(`\n`);

            await context.sendActivity(text);
            return true;
        }

        if (message.search(createRegx) === 0) {
            if (!createRegx.test(message)) {
                await context.sendActivity(`Некорректное название канала`);
                return true;
            }

            const channelName = createRegx.exec(message).groups['channelName'];
            const foundChannels = await getChannels({ name: channelName });
            if (foundChannels && foundChannels.length) {
                await context.sendActivity(`Канал **${channelName}** уже существует`);
                return true;
            }

            await createChannel({ name: channelName });
            await context.sendActivity(`Канал уведомлений **${channelName}** был успешно создан`);
            return true;
        }

        if (message.search(subscribeRegx) === 0) {
            const regexResult = subscribeRegx.exec(message);
            const channelId = regexResult.groups['channelId'];
            const channelName = regexResult.groups['channelName'];

            const foundChannels = await getChannels({ id: channelId, name: channelName });
            if (!foundChannels || !foundChannels.length) {
                await context.sendActivity(`Канал **${channelName || channelId}** не найден`);
                return true;
            }

            const user = await getUser({ userId });
            const subscribe = await getChannelsByUser({ userId: user.id, name: foundChannels[0].name });
            if (subscribe && subscribe.length > 0) {
                await context.sendActivity(`Подписка на канал **${foundChannels[0].name}** уже активна`);
                return true;
            }

            await subscribeChannel({ channelId: foundChannels[0].id, userId: user.id });
            await context.sendActivity(`Подписка на канал **${foundChannels[0].name}** активна`);
            return true;
        }

        if (message.search(unsubscribeRegx) === 0) {
            const regexResult = unsubscribeRegx.exec(message);
            const channelId = regexResult.groups['channelId'];
            const channelName = regexResult.groups['channelName'];

            const foundChannels = await getChannels({ id: channelId, name: channelName });
            if (!foundChannels || !foundChannels.length) {
                await context.sendActivity(`Канал **${channelName || channelId}** не найден`);
                return true;
            }

            const user = await getUser({ userId });
            const subscribe = await getChannelsByUser({ userId: user.id, name: foundChannels[0].name });
            if (!subscribe || !subscribe.length) {
                await context.sendActivity(`Подписка на канал **${foundChannels[0].name}** не найдена`);
                return true;
            }

            await unsubscribeChannel({ channelId: foundChannels[0].id, userId: user.id });
            await context.sendActivity(`Подписка на канал **${foundChannels[0].name}** была удалена.`);
            return true;
        }
    }
};

async function getListMessage ({ userId }) {
    const user = await getUser({ userId });
    const channels = await getChannelsByUser({ userId: user.id });

    const list = channels && channels.length
        ? channels.map(c => `id: ${c.id} name: ${c.name}`).join(`\n`)
        : `Нет действующих подписок`;

    return `**Подписки на каналы**:\n${list}`;
}

function getHelpMessage () {
    return `Подсказка для раздела **каналы оповещений**\n\n` +
        `Каналы оповещений необходимы для агрегации различных подписок в одном месте. ` +
        `Создайте канал для своей команды, наполните его событиями. ` +
        `Теперь каждый член команды может подписаться на канал и не задумываться о подписках на конкретные приложения\n` +
        `\n` +
        `${replaceHelp(helpRegx)} - подсказка раздела\n` +
        `${replaceHelp(listRegx)} - каналы, подписка на которые активна\n` +
        `${replaceHelp(getChannelsRegx)} - показать существующие каналы\n` +
        `${nameReplace(createRegx)} - создать новый канал\n` +
        `${nameReplace(subscribeRegx)} - подписаться на канал\n` +
        `${nameReplace(unsubscribeRegx)} - отписаться на канала\n`;
}

function nameReplace (text) {
    return replaceHelp(text)
        .replace(`((?<channelId>\\d+)|(?<channelName>\\S+))`, `{ChannelName} либо {id}`)
        .replace(`(?<channelName>\\S+)`, `{ChannelName}`);
}
