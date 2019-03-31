const newrelicAppName = require('./eventsName/newrelicAppName');
const zabbixAppName = require('./eventsName/zabbixAppName');
const EventType = require('./enums/EventType');
const { query } = require('./mysqlServices');
const { getUser } = require('./userServices');

const helpRegex = /\\help_channels$/i;
const listRegex = /\\list_channels$/i;
const listUserChannelsRegex = /\\list_my_channels$/;
// \12_show_events или \"channelName"_show_events
const listEventsByChanelRegex = /\\((?<channelId>\d+)|("(?<channelName>\D\S+))")_list_events$/i;

const createChannelRegx = /\\create_channel_(\"|&quot;)(?<channelName>\S+)(\"|&quot;)$/i;
const createRegx = /\\create_channel_("|&quot;)(?<channelName>\S+)("|&quot;)$/i;
const subscribeRegex = /\\subscribe_channel_((?<channelId>\d+)|(("|&quot;)(?<channelName>\S+)("|&quot;)))$/i;
const unsubscribeRegex = /\\unsubscribe_channel_((?<channelId>\d+)|(("|&quot;)(?<channelName>\S+)("|&quot;)))$/i;

// eventType мб несколько раз, но для newrelic и zabbix есть валидация, подумаю об улучшении регулярки
// \"testChannel"_add_zabbix_OfficeWebApp
// \1_add_newrelic_OfficeWebApp
const addEventInChannelRegex = /\\((?<channelId>\d+)|(("|&quot;)(?<channelName>\D\S+))("|&quot;))_add_(?<eventType>[(newrelic|zabbix)]+)_(?<appName>\S+)$/i;

// \"testChannel"_remove_zabbix_OfficeWebApp
// \1_remove_newrelic_OfficeWebApp
const removeEventInChannelRegex = /\\((?<channelId>\d+)|(("|&quot;)(?<channelName>\D\S+))("|&quot;))_remove_(?<eventType>[(newrelic|zabbix)]+)_(?<appName>\S+)$/i;

// todo прикрутить удаление каналов?
// const removeChannelRegex = /\\i_swear_i_want_to_delete_channel_((?<channelId>\d+)|("(?<channelName>\D\S+))")$/i;

module.exports = {
    async search ({ context, userId, message }) {
        if (message.search(helpRegex) === 0) {
            await context.sendActivity(getHelpMessage());
            return true;
        }

        if (message.search(listRegex) === 0) {
            const channels = await getChannels({});
            const text = !channels || !channels.length
                ? `Ни одного канала не найдено. Создайте первый`
                : channels.map(c => `id: ${c.id} name: ${c.name}`).join(`\n`);

            await context.sendActivity(text);
            return true;
        }

        if (message.search(listUserChannelsRegex) === 0) {
            const user = await getUser({ userId });
            const channels = await getChannelsByUser({ userId: user.id });

            if (channels && channels.length) {
                let text = channels.map(c => `id: ${c.id} name: ${c.name}`).join(`\n`);
                await context.sendActivity(`Ваши подписки на каналы:\n ${text}`);
            } else {
                await context.sendActivity(`Вы ещё не подписались ни на один канал оповещений`);
            }

            return true;
        }

        if (message.search(listEventsByChanelRegex) === 0) {
            const groups = listEventsByChanelRegex.exec(message).groups;
            const channelId = groups['channelId'];
            const channelName = groups['channelName'];

            const channels = await getChannels({ id: channelId, name: channelName });
            if (!channels) {
                await context.sendActivity(`Канал ${channelName || channelId} не найден`);
                return true;
            }

            const listEvents = await getListEvents({ channelId: channels[0].id });
            await context.sendActivity(`Канал **${channelName || channelId}** содержит:\n${listEvents}`);
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

        if (message.search(subscribeRegex) === 0) {
            const regexResult = subscribeRegex.exec(message);
            const channelId = regexResult.groups['channelId'];
            const channelName = regexResult.groups['channelName'];

            const foundChannels = await getChannels({ id: channelId, name: channelName });

            if (!foundChannels || !foundChannels.length) {
                await context.sendActivity(`Канал **${channelName || channelId}** не найден`);
                return true;
            }

            const user = await getUser({ userId });
            await subscribeChannel({ channelId: foundChannels[0].id, userId: user.id });
            await context.sendActivity(`Подписка на канал **${foundChannels[0].name}** активна`);
            return true;
        }

        if (message.search(unsubscribeRegex) === 0) {
            const regexResult = unsubscribeRegex.exec(message);
            const channelId = regexResult.groups['channelId'];
            const channelName = regexResult.groups['channelName'];

            const foundChannels = await getChannels({ id: channelId, name: channelName });

            if (!foundChannels || !foundChannels.length) {
                await context.sendActivity(`Канал **${channelName || channelId}** не найден`);
                return true;
            }

            const user = await getUser({ userId });
            await unsubscribeChannel({ channelId: foundChannels[0].id, userId: user.id });
            await context.sendActivity(`Подписка на канал **${foundChannels[0].name}** была удалена.`);
            return true;
        }

        if (message.search(addEventInChannelRegex) === 0) {
            const groups = addEventInChannelRegex.exec(message).groups;
            const channelId = groups['channelId'];
            const channelName = groups['channelName'];
            const eventType = groups['eventType'];
            const appName = groups['appName'];
            const fullEventName = `${eventType}_${appName}`;

            const foundChannels = await getChannels({ id: channelId, name: channelName });
            if (!foundChannels || !foundChannels.length) {
                await context.sendActivity(`Канал **${channelName || channelId}** не найден`);
                return true;
            }

            if (!isValidAppName({ eventType, appName })) {
                await context.sendActivity(`Имя [${appName}] не валидно. Событие в канал не добавлено`);
                return true;
            }

            await addEvent({ channelId: foundChannels[0].id, eventName: fullEventName });
            await context.sendActivity(`Подписка на событие **${fullEventName}** для канала **${foundChannels[0].name}** успешно сохранена`);
            return true;
        }

        if (message.search(removeEventInChannelRegex) === 0) {
            const groups = removeEventInChannelRegex.exec(message).groups;
            const channelId = groups['channelId'];
            const channelName = groups['channelName'];
            const eventType = groups['eventType'];
            const appName = groups['appName'];
            const fullEventName = `${eventType}_${appName}`;

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

            await removeEvent({ channelId: foundChannels[0].id, eventName: fullEventName });
            await context.sendActivity(`Вы отписали канал **${foundChannels[0].name}** от события **${fullEventName}**`);
            return true;
        }
    },

    async getUserIds ({ eventName }) {
        const result = await getUserIds({ eventName });
        return result.map(x => x.userId);
    },

    async getChannels ({ userId }) {
        return getChannelsByUser({ userId });
    }
};

function isValidAppName ({ eventType, appName }) {
    switch (eventType) {
    case EventType.newrelic:
        return newrelicAppName.isValidName(appName);
    case EventType.zabbix:
        return zabbixAppName.isValidName(appName);
    }

    return false;
}

async function getListEvents ({ channelId }) {
    const subscriptions = await getEvents({ channelId });
    const eventNames = subscriptions.map(s => s.eventName);
    const newrelicSubscriptions = eventNames.filter(s => s.indexOf(EventType.newrelic) >= 0);
    const zabbixSubscriptions = eventNames.filter(s => s.indexOf(EventType.zabbix) >= 0);

    let result = '';

    if (newrelicSubscriptions.length) {
        result += '**newrelic**:\n';
        result += `${newrelicSubscriptions.map(eventName => `${eventName}`).join(`\n`)}\n`;
    }

    if (zabbixSubscriptions.length) {
        result += '**zabbix**:\n';
        result += `${zabbixSubscriptions.map(eventName => `${eventName}`).join(`\n`)}\n`;
    }

    return result || `Нет подписок`;
}

function getHelpMessage () {
    return '***Команды каналов оповещений***\n\n' +
        'На текущий момент подписка возможна только на события newrelic и zabbix\n' +
        '\n' +
        '**\\list_channels** - показать все существующие каналы\n' +
        '**\\list_my_channels** - каналы, подписка на которые активна\n' +
        '**\\create_channel_"ChannelName"** - создать новый канал (кавычки обязательны, без пробелов)\n' +
        '**\\subscribe_channel_{id}** - подписаться на канал по Id\n' +
        '**\\subscribe_channel_"ChannelName"** - подписаться на канал по названию\n' +
        '**\\{id}_list_events** - отобразить список подписок канала по Id\n' +
        '**\\"ChannelName"_list_events** - то же, но по названию канала\n' +
        '\n' +
        '***Добавление подписки на событие для каналов***:\n\n' +
        'к шаблону добавляется название (в кавычках) или Id канала:\n' +
        '**\\"ChannelName"_add_newrelic_Test** или \n ' +
        '**\\{id}_add_newrelic_Test**\n' +
        '\n' +
        '***Отписка канала от события***\n\n' +
        '**\\\\"channelName"_remove_zabbix_nameApplication** - отписка канала от события по имени канала\n' +
        '**\\\\id_remove_zabbix_all** - удалить все подписки на события из zabbix для канала по id\n' +
        '**\\\\"Test"_remove_newrelic_TestApp** - удалить подписку на событие newrelic_TestApp для канала Test\n' +
        '**\\\\"Test"_remove_newrelic_all** - удалить все подписки на события из newrelic для канала Test\n';
}

// Обращения к базе, вынести отдельно
async function getChannels ({ id, name }) {
    let sql = `select 
                id, 
                name 
                from channels 
                where 1 = 1`;
    id && (sql += ` and id = '${id}'`);
    name && (sql += ` and name = '${name}'`);
    return query({ sqlString: sql });
}

function createChannel ({ name }) {
    let sql = `insert into channels 
                (name) 
                values ('${name}')`;
    return query({ sqlString: sql });
}

function subscribeChannel ({ channelId, userId }) {
    let sql = `insert into channels_users 
                (channel_id, user_id) 
                value (${channelId}, ${userId})`;
    return query({ sqlString: sql });
}

function unsubscribeChannel ({ channelId, userId }) {
    let sql = `delete 
                from channels_users
                where channel_id = ${channelId}
                and user_id = ${userId}`;
    return query({ sqlString: sql });
}

function getChannelsByUser ({ userId }) {
    let sql = `select 
                ch.id as id, 
                ch.name as name 
                from channels as ch 
                join channels_users as cu on cu.channel_id = ch.id
                where cu.user_id = ${userId} 
                order by ch.id`;
    return query({ sqlString: sql });
}

function addEvent ({ channelId, eventName }) {
    let sql = `insert into channels_subscriptions 
                (channel_id, event_name) 
                value (${channelId}, '${eventName}')`;
    return query({ sqlString: sql });
}

function removeEvent ({ channelId, eventName }) {
    let sql = `delete 
                from channels_subscriptions 
                where channel_id = ${channelId} 
                and event_name = '${eventName}'`;
    return query({ sqlString: sql });
}

function getEvents ({ channelId }) {
    let sql = `select 
                event_name as eventName 
                from channels_subscriptions 
                where channel_id = ${channelId}`;
    return query({ sqlString: sql });
}

function getUserIds ({ eventName }) {
    let sql = `select 
                distinct(cu.user_id) as userId
                from channels_subscriptions as cs
                join channels_users as cu on cu.channel_id = cs.channel_id
                where cs.event_name = '${eventName}'`;
    return query({ sqlString: sql });
}
