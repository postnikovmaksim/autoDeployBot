const { ActivityTypes } = require('botbuilder');
const { saveOrUpdateUser, getUser } = require('./userServices');
const channelsServices = require('./channelsServices');
const subscriptionsServices = require('./subscriptionsServices');
const newrelicAppName = require('./eventsName/newrelicAppName');
const zabbixAppName = require('./eventsName/zabbixAppName');

const deployBoxRegx = /deploy_\S+/;
const newrelicRegx = /newrelic_\S+/;
const zabbixRegx = /zabbix_\S+/;
const masterAutoCompleteRegx = /master_auto_complete/;
const testRegx = /test/;

const allChanellsRegex = /\\all_channels$/i;
const createChannelRegx = /\\create_channel_\"(?<channelName>\S+)\"$/i;
const subscribeToChannelByIdOrNameRegex = /\\add_channel_((?<channelId>\d+)|(\"(?<channelName>\S+)\"))$/i;

const unsubscibeFromChannelRegex = /\\remove_channel_((?<channelId>\d+)|(\"(?<channelName>\S+)\"))$/i;
const listUserChannelsRegex = /\\my_channels$/;

// \1_add_newrelic_OfficeWebApp //eventType мб несколько раз, но для newrelic и zabbix есть валидация, подумаю об улучшении регулярки
// \"testChannel"_add_zabbix_OfficeWebApp
const subscribeChannelToEventRegex = /\\((?<channelId>\d+)|(\"(?<channelName>\D\S+))\")_add_(?<eventType>[(newrelic|zabbix)]+)_(?<appName>\S+)$/i;

// \"testChannel"_remove_zabbix_OfficeWebApp
const universalUnsubscribeChannelFromEventRegex = /\\((?<channelId>\d+)|(\"(?<channelName>\D\S+))\")_remove_(?<eventType>[(newrelic|zabbix)]+)_(?<appName>\S+)$/i;

// \12_show_events или \"channelName"_show_events
const showChannelEventsRegex = /\\((?<channelId>\d+)|(\"(?<channelName>\D\S+))\")_show_events$/i;
const removeChannelRegex = /\\i_swear_i_want_to_delete_channel_((?<channelId>\d+)|(\"(?<channelName>\D\S+))\")$/i;

class EchoBot {
    async onTurn(context) {
        if (context.activity.type !== ActivityTypes.Message) {
            return;
        }

        console.log(`Получено сообщение от ${context.activity.from.name}:`, context.activity.text);

        await saveOrUpdateUser({ context });
        const message = context.activity.text;

        // autoDeploy
        if (message.search(/\\add_deploy_\S+/) === 0) {
            await createSubscriptions({ context, message, regx: deployBoxRegx });
            return;
        }

        if (message.search(/\\remove_deploy_\S+/) === 0) {
            await deleteSubscriptions({ context, message, regx: deployBoxRegx });
            return;
        }

        if (message.search(/\\remove_all_deploy/) === 0) {
            await deleteAllTypeSubscriptions({ context, message, like: 'deploy_box' });
            return;
        }

        // newrelic
        if (message.search(/\\add_newrelic_/) === 0) {
            const appName = message.match(newrelicRegx)[0].replace('newrelic_', '');
            if (newrelicAppName.isValidName(appName)) {
                await createSubscriptions({ context, message, regx: newrelicRegx });
            } else {
                await responseIsNotValidName(context, appName);
            }
            return;
        }

        if (message.search(/\\remove_newrelic_/) === 0) {
            await deleteSubscriptions({ context, message, regx: newrelicRegx });
            return;
        }

        if (message.search(/\\remove_all_newrelic/) === 0) {
            await deleteAllTypeSubscriptions({ context, message, like: 'newrelic' });
            return;
        }

        // zabbix
        if (message.search(/\\add_zabbix_/) === 0) {
            const appName = message.match(zabbixRegx)[0].replace('zabbix_', '');
            if (zabbixAppName.isValidName(appName)) {
                await createSubscriptions({ context, message, regx: zabbixRegx });
            } else {
                await responseIsNotValidName(context, appName);
            }
            return;
        }

        if (message.search(/\\remove_zabbix_/) === 0) {
            await deleteSubscriptions({ context, message, regx: zabbixRegx });
            return;
        }

        if (message.search(/\\remove_all_zabbix/) === 0) {
            await deleteAllTypeSubscriptions({ context, message, like: 'zabbix' });
            return;
        }

        // outher
        if (message.search(/\\add_master_auto_complete/) === 0) {
            await createSubscriptions({ context, message, regx: masterAutoCompleteRegx });
            return;
        }

        if (message.search(/\\remove_master_auto_complete/) === 0) {
            await deleteSubscriptions({ context, message, regx: masterAutoCompleteRegx });
            return;
        }
        if (message.search(/\\add_test/) === 0) {
            await createSubscriptions({ context, message, regx: testRegx });
            return;
        }

        if (message.search(/\\remove_test/) === 0) {
            await deleteSubscriptions({ context, message, regx: testRegx });
            return;
        }

        if (message.search(/\\remove_all/) === 0) {
            await deleteAllSubscriptions({ context, message });
            return;
        }

        if (message.search(/\\list$/) === 0) {
            await sendList({ context });
            return;
        }

        if (message.search(/\\help$/) === 0) {
            await sendHelp({ context });
            return;
        }

        // channels
        if (message.search(allChanellsRegex) === 0) {
            await sendChannels({ context });
            return;
        }

        if (message.search(createChannelRegx) === 0) {
            await createChannel({ context, message });
            return;
        }

        if (message.search(subscribeToChannelByIdOrNameRegex) === 0) {
            return await subscribeToChannel({ context, message });
        }

        if (message.search(unsubscibeFromChannelRegex) === 0) {
            return await unsubscribeFromChannel({ context, message});
        }

        if (message.search(listUserChannelsRegex) === 0) {
            return getChannelsSubscriptions({ context });
        }

        if (message.search(subscribeChannelToEventRegex) === 0) {
            await createChannelEventsSubscription({ context, message });
            return;
        }

        if (message.search(universalUnsubscribeChannelFromEventRegex) === 0) {
            return await removeChannelEventsSubscription({ context, message });
        }

        if (message.search(showChannelEventsRegex) === 0) {
            await showChannelEvents({ context, message });
            return;
        }

        await context.sendActivity('Команда не распознана, используйте \\help, что бы посмотреть доступные команды');
    }
}

async function createChannelEventsSubscription({ context, message }) {
    const regexResult = subscribeChannelToEventRegex.exec(message);
    const groups = regexResult.groups;
    const channelId = groups['channelId'];
    const channelName = groups['channelName'];
    const eventType = groups['eventType'];
    const appName = groups['appName'];
    const fullEventName = `${eventType}_${appName}`;

    const channel = await channelsServices.getChannel({ id: channelId, name: channelName });
    if (!channel) {
        return await context.sendActivity(`Канал ${channelName || channelId} не найден`);
    }

    if (!isvalidAppNameForChannel(eventType, appName)) {
        return await responseIsNotValidName(context, appName);
    }

    await channelsServices.saveSubscription({ channelId: channel.Id, event: `${fullEventName}` });
    await context.sendActivity(`Подписка на событие ${fullEventName} для канала ${channel.Name} успешно сохранена`);
}

async function removeChannelEventsSubscription({ context, message }) {
    const regexResult = universalUnsubscribeChannelFromEventRegex.exec(message);
    const groups = regexResult.groups; //ну похоже на то, что методом выше, да

    const channelId = groups['channelId'];
    const channelName = groups['channelName'];
    const eventType = groups['eventType'];
    const appName = groups['appName'];
    const fullEventName = `${eventType}_${appName}`;

    const channel = await channelsServices.getChannel({ id: channelId, name: channelName });
    if (!channel) {
        return await context.sendActivity(`Канал ${channelName || channelId} не найден`);
    }
    
    if (appName.search(/^all$/i) === 0) {
        await channelsServices.removeAllSubscriptionByType({ channelId: channel.Id, eventType });
        return await context.sendActivity(`Вы отписали канал ${channel.Name} от всех событий с типом ${eventType}.`);
    }

    await channelsServices.removeSubscription({ channelId: channel.Id, eventName: fullEventName });
    await context.sendActivity(`Вы отписали канал ${channel.Name} от события ${fullEventName}`);
}

function isvalidAppNameForChannel(eventType, appName) {
    if (!appName || !eventType || !appName.length) {
        return false;
    }

    switch (eventType) {
        case `newrelic`:
            return newrelicAppName.isValidName(appName);
        case `zabbix`:
            return zabbixAppName.isValidName(appName);
    }

    return true;
}

async function showChannelEvents({ context, message }) {
    const regexResult = showChannelEventsRegex.exec(message);
    const groups = regexResult.groups;
    const channelId = groups['channelId'];
    const channelName = groups['channelName'];

    const channel = await channelsServices.getChannel({ id: channelId, name: channelName });
    if (!channel) {
        return await context.sendActivity(`Канал ${channelName || channelId} не найден`);
    }

    await sendList({ context, channelId: channel.Id });
}


async function responseIsNotValidName(context, appName) {
    await context.sendActivity(`Имя [${appName}] не валидно. Подписка не создана`);
}

async function createSubscriptions({ context, message, regx }) {
    const eventName = getEventName({ message, regx });
    await subscriptionsServices.saveSubscriptions({ userId: context.activity.from.id, eventName: eventName });
    await context.sendActivity(`Включена подписка на событие ${eventName}`);
}

async function deleteSubscriptions({ context, message, regx }) {
    const eventName = getEventName({ message, regx });
    await subscriptionsServices.removeSubscriptions({ userId: context.activity.from.id, eventName: eventName });
    await context.sendActivity(`Удалена подписка на событие ${eventName}`);
}

async function deleteAllTypeSubscriptions({ context, message, like }) {
    await subscriptionsServices.removeAllTypeSubscriptions({ userId: context.activity.from.id, like });
    await context.sendActivity(`Удалена подписка на события ${like}`);
}

async function deleteAllSubscriptions({ context }) {
    await subscriptionsServices.removeAllSubscriptions({ userId: context.activity.from.id });
    await context.sendActivity(`Удалена подписка на все события`);
}

function getEventName({ message, regx }) {
    return message.match(regx)[0];
}

async function sendList({ context, channelId }) {
    const user = await getUser({ userId: context.activity.from.id });
    const subscriptions = channelId ? await channelsServices.getSubscribedEventsName({ channelId }) : await subscriptionsServices.getSubscriptions({ userId: user.id });

    const deploySubscriptions = subscriptions.filter(s => !!s.match(deployBoxRegx));
    const newrelicSubscriptions = subscriptions.filter(s => !!s.match(newrelicRegx));
    const zabbixSubscriptions = subscriptions.filter(s => !!s.match(zabbixRegx));
    const outherSubscriptions = subscriptions.filter(s => !s.match(deployBoxRegx) && !s.match(newrelicRegx) && !s.match(zabbixRegx));

    let result = '';

    if (channelId && subscriptions && subscriptions.length) {
        result += `Подписки канала ${channelId}:\n\n`;
    }

    if (deploySubscriptions.length) {
        result += 'deploy:';
        deploySubscriptions.forEach(eventName => result += `\n${eventName}`);
        result += '\n';
    }

    if (newrelicSubscriptions.length) {
        result += 'newrelic:';
        newrelicSubscriptions.forEach(eventName => result += `\n${eventName}`);
        result += '\n';
    }

    if (zabbixSubscriptions.length) {
        result += 'zabbix:';
        zabbixSubscriptions.forEach(eventName => result += `\n${eventName}`);
        result += '\n';
    }

    if (outherSubscriptions.length) {
        result += 'outher:';
        outherSubscriptions.forEach(eventName => result += `\n${eventName}`);
        result += '\n';
    }
    
    await context.sendActivity(result || 'У вас нет действующих подписок');
}

async function sendChannels({ context }) {
    const groups = await channelsServices.getChannels();
    let result = '';
    groups.forEach(grp => result += `${grp.Id} ${grp.Name}\n`);
    await context.sendActivity(result || 'Ни одного канала не найдено. Создайте первый');
}

async function createChannel({ context, message }) {
    if (!createChannelRegx.test(message)) {
        await context.sendActivity("Некорректное название канала");
        return;
    }

    const regexResult = createChannelRegx.exec(message);
    const channelName = regexResult.groups["channelName"];
    const channel = await channelsServices.get({ name: channelName });
    if (channel && channel.length) {
        await context.sendActivity(`Канал "${channel[0].Name}" уже существует.`);
        return;
    }

    await channelsServices.createChannel({ channelName });
    await context.sendActivity(`Канал уведомлений *${channelName}* был успешно создан\n`);
}

async function subscribeToChannel({ context, message }) {
    const regexResult = subscribeToChannelByIdOrNameRegex.exec(message);
    const channelId = regexResult.groups["channelId"];
    const channelName = regexResult.groups["channelName"];

    const foundChannels = await channelsServices.get({ id: channelId, name: channelName });

    if (!foundChannels || !foundChannels.length) {
        return await context.sendActivity(`Канал ${channelName || channelId} не найден.`);
    }

    const user = await getUser({ userId: context.activity.from.id });
    await channelsServices.subscribeChannel({ channelId: foundChannels[0].Id, userId: user.id });
    await context.sendActivity(`Подписка на канал ${foundChannels[0].Name} *активна*.`);     
}

async function unsubscribeFromChannel({ context, message }) {
    const regexResult = unsubscibeFromChannelRegex.exec(message);
    const channelId = regexResult.groups["channelId"];
    const channelName = regexResult.groups["channelName"];

    const foundChannels = await channelsServices.get({ id: channelId, name: channelName });

    if (!foundChannels || !foundChannels.length) {
        return await context.sendActivity(`Канал ${channelName || channelId} не найден.`);
    }

    const user = await getUser({ userId: context.activity.from.id });

    await channelsServices.unsubscribeChannelById({ channelId: foundChannels[0].Id, userId: user.id });
    await context.sendActivity(`Подписка на канал ${foundChannels[0].Name} была *удалена*.`);     
}

async function getChannelsSubscriptions({ context }) {
    const user = await getUser({ userId: context.activity.from.id });
    const groups = await channelsServices.getSubscribedChannels({ userId: user.id });

    if (groups && groups.length) {
        let result = '';
        groups.forEach(grp => result += `${grp.Id} ${grp.Name}\n`);
        return await context.sendActivity(`Ваши подписки на каналы:\n ${result}`);
    }

    await context.sendActivity(`Вы ещё не подписались ни на один канал оповещений`);
}

async function sendHelp({ context }) {
    await context.sendActivity(
        '\\help - описание всех доступных команд\n' +
        '\n' +
        '\\add_deploy_box** - подписаться на событие deploy для бокса\n' +
        '\\remove_deploy_box** - удалить подписку на событие deploy для бокса\n' +
        '\\remove_all_deploy - удалить все подписки на deploy\n' +
        '\n' +
        '\\add_newrelic_nameApplication - подписаться на событие в newrelic\n' +
        '\\remove_newrelic_nameApplication - удалить подписку на событие в newrelic\n' +
        '\\remove_all_newrelic - удалить все подписки на newrelic\n' +
        '\n' +
        '\\add_zabbix_nameApplication - подписаться на событие в zabbix\n' +
        '\\remove_zabbix_nameApplication - удалить подписку на событие в zabbix\n' +
        '\\remove_all_zabbix - удалить все подписки на zabbix\n' +
        '\n' +
        '\\add_master_auto_complete - подписаться на отчет по работе консоли\n' +
        '\\remove_master_auto_complete - подписаться на отчет по работе консоли\n' +
        '\n' +
        '\\remove_all - удалить все подписки \n' +
        '\\list - отобразить текушие подписки на события\n' +
        '\n' +
        '\n' +
        `\n*Команды каналов оповещения*\n` +
        '\\all_channels - показать все существующие каналы\n' +
        '\\create_channel_"channelName" - создать новый канал оповещений\n' +
        '\\add_channel_{id} - подписаться на канал по Id\n' +
        '\\add_channel_"{ChannelName}" - подписаться на канал по названию\n' +
        `\\my_channels - каналы, подписка на которые активна\n` +
        '\n' +
        '\n' +
        'Добавление подписки на событие для каналов почти аналогично - к шаблону добавляется название (в кавычках) или Id канала:\n' +
        '\\"{channelName}"_add_newrelic_Test ' +
        '\n' +
        'или \\{channelId}_add_newrelic_Test ' +
        '\n' +
        '\n' +
        `Отписка канала от события - \n \\{id}|''{channelName}''_remove_zabbix_{приложение|all}\n` +
        `\\'Test'_remove_newrelic_TestApp\n` +
        `или \\'Test'_remove_newrelic_all\n` +
        `\n` +
        `\n` +
        'более подробно https://confluence.mdtest.org/pages/viewpage.action?pageId=26280901'
    );
}

exports.EchoBot = EchoBot;
