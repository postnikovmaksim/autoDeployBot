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
const createGroupRegx = /\\create_channel_\"(\S+)\"$/;
const addChannelByIdRegex = /\\add_channel_(\d+)$/;
const addChannelByNameRegex = /\\add_channel_\"(\S+)\"$/;
const removeChannelByIdRegex = /\\remove_channel_(\d+)$/;
const removeChannelByNameRegex = /\\remove_channel_\"(\S+)\"$/;
const listChannelsRegex = /\\list_channels$/;
const addDeployEventToChannelWithIdRegex = /\\(\d+)_add_deploy_\S+$/;
const addDeployEventToChannelWithNameRegex = /\"(\S+)\"_add_deploy_\S+$/;
const addNewrelicEventToChannelWithIdRegex = /\\(\d+)_add_newrelic_\S+$/;
const addNewrelicEventToChannelWithNameRegex = /\\(\S+)_add_newrelic_\S+$/;


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
        if (message.search(/\\all_channels$/) === 0) {
            await sendChannels({ context });
            return;
        }

        if (message.search(createGroupRegx) === 0) {
            await createChannel({ context, message, regex: createGroupRegx });
            return;
        }

        if (message.search(addChannelByIdRegex) === 0) {
            await subscribeChannelById({ context, message, regex: addChannelByIdRegex });
            return;
        }

        if (message.search(addChannelByNameRegex) === 0) {
            await subscribeChannelByName({ context, message, regex: addChannelByNameRegex });
            return;
        }

        if (message.search(removeChannelByIdRegex) === 0) {
            await unsubscribeChannelById({ context, message, regex: removeChannelByIdRegex });
            return;
        }

        if (message.search(removeChannelByNameRegex) === 0) {
            await unsubscribeChannelByName({ context, message, regex: removeChannelByNameRegex });
            return;
        }

        if (message.search(listChannelsRegex) === 0) {
            await getChannelsSubscriptions({ context });
            return;
        }

        if (message.search(addDeployEventToChannelWithIdRegex) === 0) {
            await createChannelSubscription({ context, message });
        }

        if (message.search(addNewrelicEventToChannelWithNameRegex) === 0) {
            await createChannelSubscription({ context, message, channelRegex: addNewrelicEventToChannelWithNameRegex, eventRegex: newrelicRegx });
            return;
        }

        await context.sendActivity('Команда не распознана, используйте \\help, что бы посмотреть доступные команды');
    }
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

async function sendList({ context }) {
    const user = await getUser({ userId: context.activity.from.id });
    const subscriptions = await subscriptionsServices.getSubscriptions({ userId: user.id });
    const deploySubscriptions = subscriptions.filter(s => !!s.match(deployBoxRegx));
    const newrelicSubscriptions = subscriptions.filter(s => !!s.match(newrelicRegx));
    const zabbixSubscriptions = subscriptions.filter(s => !!s.match(zabbixRegx));
    const outherSubscriptions = subscriptions.filter(s => !s.match(deployBoxRegx) && !s.match(newrelicRegx) && !s.match(zabbixRegx));

    let result = '';

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

async function createChannel({ context, message, regex }) {
    if (!regex.test(message)) {
        await context.sendActivity("Некорректное название канала");
        return;
    }

    let channelName = getChannelName({ message, regex });
    const channel = await channelsServices.get({ name: channelName });
    if (channel && channel.length) {
        await context.sendActivity(`Канал "${channelName}" уже существует.`);
        return;
    }

    await channelsServices.createChannel({ channelName });
    await context.sendActivity(`Канал уведомлений ${channelName} был успешно создан\n`);
}

function getChannelName({ message, regex }) {
    let m, result;
    m = regex.exec(message);
    result = m[1];//0 - полное совпадение, берём первую группу
    return result;
}

async function subscribeChannelById({ context, message, regex }) {
    const channelId = regex.exec(message)[1];
    const user = await getUser({ userId: context.activity.from.id });

    const channel = await channelsServices.get({ id: channelId });
    if (channel && channel.length) {
        await channelsServices.subscribeChannel({ channelId, userId: user.id });
        await context.sendActivity(`Вы успешно подписались на канал ${channel[0].Name}`);
        return;
    }

    await context.sendActivity(`Канала с Id '${channelId}' не существует`);
}

async function subscribeChannelByName({ context, message, regex }) {
    const channelName = getChannelName({ message, regex });
    const channels = await channelsServices.get({ name: channelName });
    if (channels && channels.length) {
        const user = await getUser({ userId: context.activity.from.id });
        const channel = channels[0];
        await channelsServices.subscribeChannel({ channelId: channel.Id, userId: user.id });
        await context.sendActivity(`Подписка на канал ${channel.Name} активна.`);
        return;
    }

    await context.sendActivity(`Канал с названием ${channelName} не был найден`);
}

async function unsubscribeChannelById({ context, message, regex }) {
    const channelId = regex.exec(message)[1];
    const user = await getUser({ userId: context.activity.from.id });
    const channel = await channelsServices.get({ id: channelId });
    if (channel && channel.length) {
        await channelsServices.unsubscribeChannelById({ channelId, userId: user.id });
        await context.sendActivity(`Вы отписались от канала ${channel[0].Name}`);
        return;
    }

    await context.sendActivity(`Канал с Id ${channelId} не был найден`);
}

async function unsubscribeChannelByName({ context, message, regex }) {
    const channelName = getChannelName({ message, regex });
    const user = await getUser({ userId: context.activity.from.id });
    const channels = await channelsServices.get({ name: channelName });
    if (!channels || !channels.length) {
        await context.sendActivity(`Канал "${channelName}" не был найден`);
        return;
    }

    const channel = channels[0];
    await channelsServices.unsubscribeChannelById({ channelId: channel.Id, userId: user.id });
    await context.sendActivity(`Вы отписались от канала ${channel.Name}`);
}

async function getChannelsSubscriptions({ context }) {
    const user = await getUser({ userId: context.activity.from.id });
    const groups = await channelsServices.getSubscribedChannels({ userId: user.id });

    if (groups && groups.length) {
        let result = '';
        groups.forEach(grp => result += `${grp.Id} ${grp.Name}\n`);
        await context.sendActivity(`Ваши подписки на каналы:\n ${result}`);
        return;
    }

    await context.sendActivity(`Вы ещё не подписались ни на один канал оповещений`);
}

async function createChannelSubscription({ context, message, channelRegex, eventRegex }) {
    const user = await getUser({ userId: context.activity.from.id });
    const channel = getChannelName({ message, regex: channelRegex });
    const channelFixedName = channel.replace(/(\"\"\S+\"\")$/ig, '$1');
    console.log(channelFixedName);
    const groupId = getGroupId({ message, regex: channelRegex });
    
    const eventName = getEventName({ message, regx: eventRegex });

    console.log(user, groupId, eventName);
}

function getGroupId({ message, regex }) {
    let r = regex.exec(message);
    if (r && r[0]) {
        return r[1];
    }
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
        '\\all_channels - показать все существующие каналы\n' +
        '\\create_channel_"channelName" - создать новый канал оповещений\n' +
        '\\add_channel_{id} - подписаться на канал по Id\n' +
        '\\add_channel_"{ChannelName}" - подписаться на канал по названию\n' +
        `\\list_channels - каналы, подписка на которые активна\n` +
        '\n' +
        '\n' +
        'Добавление подписки на событие для каналов почти аналогично - к шаблону добавляется название (в кавычках) или Id канала:\n' + 
        '\\"{channelName}"_add_newrelic_Test ' +
        '\n' +
        'или \\{channelId}_add_newrelic_Test ' +
        '\n' +
        '\n' +
        'более подробно https://confluence.mdtest.org/pages/viewpage.action?pageId=26280901'
    );
}

exports.EchoBot = EchoBot;
