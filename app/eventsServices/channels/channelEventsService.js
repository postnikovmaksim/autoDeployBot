const newrelicAppName = require('./../newrelic/newrelicAppName');
const zabbixAppName = require('./../zabbix/zabbixAppName');
const EventType = require('./../../enums/EventType');
const { replaceHelp } = require('./../../utils');
const { getEvents, addEvent, removeEvent } = require('./../../dao/channelEventsServices');
const { getChannels } = require('./../../dao/channelsService');
const timeReportServices = require('./../../taskServices/timeReportServices');

const helpRegx = /help_channels_event$/i;
const listEventsRegx = /((?<channelId>\d+)|(?<channelName>\S+))_list_events$/i;
const addEventRegex = /((?<channelId>\d+)|(?<channelName>\S+))_add_(?<eventType>\S+)_(?<eventName>\S+)$/i;
const removeEventRegex = /((?<channelId>\d+)|(?<channelName>\S+))_remove_(?<eventType>\S+)_(?<eventName>\S+)$/i;

module.exports = {
    getHelpMessage () {
        return `${replaceHelp(helpRegx)} - помощь раздела "события каналов оповещений"`;
    },

    async search ({ context, userId, message }) {
        if (message.search(helpRegx) === 0) {
            await context.sendActivity(getHelpMessage());
            return true;
        }

        if (message.search(listEventsRegx) === 0) {
            const groups = listEventsRegx.exec(message).groups;
            const channelId = groups['channelId'];
            const channelName = groups['channelName'];

            const channels = await getChannels({ id: channelId, name: channelName });
            if (!channels) {
                await context.sendActivity(`Канал ${channelName || channelId} не найден`);
                return true;
            }

            const listEvents = await getListEvents({ channelId: channels[0].id, channelName: channels[0].name });
            await context.sendActivity(`Канал **id: ${channels[0].id} name: ${channels[0].name}** содержит:\n${listEvents}`);
            return true;
        }

        if (message.search(addEventRegex) === 0) {
            const groups = addEventRegex.exec(message).groups;
            const channelId = groups['channelId'];
            const channelName = groups['channelName'];
            const eventType = groups['eventType'];
            const eventName = groups['eventName'];
            const fullEventName = `${eventType}_${eventName}`;

            const foundChannels = await getChannels({ id: channelId, name: channelName });
            if (!foundChannels || !foundChannels.length) {
                await context.sendActivity(`Канал **${channelName || channelId}** не найден`);
                return true;
            }

            const isValidType = isValidTypeEvent({ eventType });
            if (!isValidType) {
                await context.sendActivity(`Тип события **${eventType}** не валиден. Событие в канал не добавлено`);
                return true;
            }

            const validApp = await isValidAppName({ eventType, appName: eventName });
            if (!validApp) {
                await context.sendActivity(`Имя события **${eventName}** не валидно. Событие в канал не добавлено`);
                return true;
            }

            const foundEvent = await getEvents({ channelId, eventName: fullEventName });
            if (foundEvent && foundEvent.length) {
                await context.sendActivity(`Подписка на **${validApp.name || eventName}** для канала уже активна`);
                return true;
            }

            await addEvent({ channelId: foundChannels[0].id, eventName: fullEventName });
            await context.sendActivity(`Подписка на **${validApp.name || eventName}** для канала **${foundChannels[0].name}** успешно сохранена`);
            return true;
        }

        if (message.search(removeEventRegex) === 0) {
            const groups = removeEventRegex.exec(message).groups;
            const channelId = groups['channelId'];
            const channelName = groups['channelName'];
            const eventType = groups['eventType'];
            const eventName = groups['eventName'];
            const fullEventName = `${eventType}_${eventName}`;

            const foundChannels = await getChannels({ id: channelId, name: channelName });
            if (!foundChannels || !foundChannels.length) {
                await context.sendActivity(`Канал **${channelName || channelId}** не найден`);
                return true;
            }

            // todo реализовать отписку от всех собыйтий для канала (или от группы событий по префиксу)
            // if (appName.search(/^all$/i) === 0) {
            //     await channelsServices.removeAllSubscriptionByType({ channelId: channel.Id, eventType });
            //     return await context.sendActivity(`Вы отписали канал **${channel.Name}** от всех событий с типом **${eventType}**.`);
            // }

            // todo добавить проверку на наичиие подписки на событие
            const foundEvent = await getEvents({ channelId, eventName: fullEventName });
            if (!foundEvent || !foundEvent.length) {
                await context.sendActivity(`Собыйтие **${fullEventName}** не найдено`);
                return true;
            }

            await removeEvent({ channelId: foundChannels[0].id, eventName: fullEventName });
            await context.sendActivity(`Вы отписали канал **${foundChannels[0].name}** от события **${fullEventName}**`);
            return true;
        }
    }
};

function isValidTypeEvent ({ eventType }) {
    return Object.values(EventType).find(x => x === eventType);
}

function isValidAppName ({ eventType, appName: eventName }) {
    switch (eventType) {
    case EventType.newrelic:
        return newrelicAppName.isValidName(eventName);
    case EventType.zabbix:
        return zabbixAppName.isValidName(eventName);
    case EventType.kibana:
        // временно проверяем по newrelic
        return newrelicAppName.isValidName(eventName);
    case EventType.timeReport:
        return timeReportServices.isValidName({ userName: eventName });
    }

    return true;
}

async function getListEvents ({ channelId, channelName }) {
    const subscriptions = await getEvents({ channelId });
    const eventNames = subscriptions.map(s => s.eventName);

    const text = Object.values(EventType).map(eventName => {
        const subscriptions = eventNames.filter(s => s.indexOf(eventName) >= 0);

        const list = subscriptions && subscriptions.length
            ? subscriptions.map(eventName => `-- ${eventName}`).sort().join(`\n`)
            : `Нет действующих подписок`;

        return `**${eventName}**\n${list}`
    });

    return text.join(`\n\n`);
}

function getHelpMessage () {
    return 'Подсказка для раздела **каналов оповещений**\n\n' +
        'Каналы оповещений необходимы для агрегации различных подписок в одном месте. ' +
        'Создайте канал для своей команды, наполните его событиями. ' +
        'Теперь каждый член команды может подписаться на канал и не задумываться о подписках на конкретные приложения\n' +
        '\n' +
        `${replaceHelp(helpRegx)} - подсказка раздела\n` +
        `${nameReplace(listEventsRegx)} - показать все события, на которые подписан канал\n` +
        `${nameReplace(addEventRegex)} - добавить собыйтие в канал\n` +
        `${nameReplace(removeEventRegex)} - удалить собыйтие в канал\n` +
        '\n' +
        '*-- {typeEvent} должно содержать префикс события, например: newrelic, zabbix, deploy*\n' +
        '*-- {nameEvent} должно содержать имя события или приложения, например: Tester, box18*\n';
}

function nameReplace (text) {
    return replaceHelp(text)
        .replace(`((?<channelId>\\d+)|(?<channelName>\\S+))`, `{ChannelName} либо {id}`)
        .replace(`(?<eventType>\\S+)`, `{typeEvent}`)
        .replace(`(?<eventName>\\S+)`, `{nameEvent}`);
}
