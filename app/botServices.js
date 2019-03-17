const { ActivityTypes } = require('botbuilder');
const { saveOrUpdateUser, getUser } = require('./userServices');
const groupsServices = require('./groupsServices');
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


class EchoBot {
    async onTurn (context) {
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
            const appName = message.match(newrelicRegx)[0].replace('zabbix_', '');
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
        if (message.search(/\\show_all_channels$/) === 0) {
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
            await createChannelSubscription({context, message });
        }
        await context.sendActivity('Команда не распознана, используйте \\help, что бы посмотреть доступные команды');
    }
}

async function responseIsNotValidName (context, appName) {
    await context.sendActivity(`Имя [${appName}] не валидно. Подписка не создана`);
}

async function createSubscriptions ({ context, message, regx }) {
    const eventName = getEventName({ message, regx });
    await subscriptionsServices.saveSubscriptions({ userId: context.activity.from.id, eventName: eventName });
    await context.sendActivity(`Включена подписка на событие ${eventName}`);
}

async function deleteSubscriptions ({ context, message, regx }) {
    const eventName = getEventName({ message, regx });
    await subscriptionsServices.removeSubscriptions({ userId: context.activity.from.id, eventName: eventName });
    await context.sendActivity(`Удалена подписка на событие ${eventName}`);
}

async function deleteAllTypeSubscriptions ({ context, message, like }) {
    await subscriptionsServices.removeAllTypeSubscriptions({ userId: context.activity.from.id, like });
    await context.sendActivity(`Удалена подписка на события ${like}`);
}

async function deleteAllSubscriptions ({ context }) {
    await subscriptionsServices.removeAllSubscriptions({ userId: context.activity.from.id });
    await context.sendActivity(`Удалена подписка на все события`);
}

function getEventName ({ message, regx }) {
    return message.match(regx)[0];
}

async function sendList ({ context }) {
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

async function sendChannels ({ context }) {
    const groups = await groupsServices.getChannels();
    let result = '';
    groups.forEach(grp => result += `${grp.Id} ${grp.Name}\n`);
    await context.sendActivity(result || 'Ни одного канала не найдено. Создайте первый');
}

async function createChannel ({ context, message, regex }) {
    if (!regex.test(message)){
        await context.sendActivity("Некорректное название канала");
        return;
    }

    let channelName = getChannelName({ message, regex });
    const isChannelExists = groupsServices.isChannelExists({ name: channelName });
    if (isChannelExists) {
        await context.sendActivity(`Канал "${channelName}" уже существует.`);
        return;
    }

    await groupsServices.createChannel({ channelName });
    await context.sendActivity(`Канал уведомлений ${channelName} был успешно создан\n`);
}

function getChannelName ({ message, regex }) {
    let m, result;
    m = regex.exec(message);
    result = m[1];//0 - полное совпадение, берём первую группу
    return result;
}

async function subscribeChannelById({ context, message, regex }) {
    const channelId = regex.exec(message)[1];
    const user = await getUser({ userId: context.activity.from.id });
    const isExists = await groupsServices.isChannelExists({ id: channelId });
    if (!isExists) {
        await context.sendActivity(`Канала с Id '${channelId}' не существует`);
        return;
    }

    await groupsServices.subscribeChannel({ channelId, userId: user.id });
    await context.sendActivity(`Вы успешно подписались на канал с id ${channelId}`); //todo возвращать полный объект канала
}

async function subscribeChannelByName({ context, message, regex }) {
    const channelName = getChannelName({ message, regex });
    const channelId = await groupsServices.getChannelIdByName({ channelName });
    const user = await getUser({ userId: context.activity.from.id });
    if (channelId) {
        await groupsServices.subscribeChannel({ channelId, userId: user.id});
        await context.sendActivity(`Подписка на канал ${channelName} активна.`); 
        return;
    }

    await context.sendActivity(`Канал с названием ${channelName} не был найден`);
}

async function unsubscribeChannelById({ context, message, regex }) {
    const channelId = regex.exec(message)[1]; 
    const user = await getUser({ userId: context.activity.from.id });
    await groupsServices.unsubscribeChannelById({ channelId, userId: user.id });
    await context.sendActivity(`Вы отписались от канала ${channelId}`);
}

async function unsubscribeChannelByName({ context, message, regex }) {
    const channelName = getChannelName({ message, regex });
    const user = await getUser({ userId: context.activity.from.id });    
    const channelId = await groupsServices.getChannelIdByName({ channelName });

    if (channelId) {
        await groupsServices.unsubscribeChannelById({ channelId, userId: user.id });
        await context.sendActivity(`Вы отписались от канала ${channelName}`);
    }
}

async function getChannelsSubscriptions({ context }) {
    const user = await getUser({ userId: context.activity.from.id });
    const groups = await groupsServices.getSubscribedChannels({ userId: user.id });

    if (groups && groups.length) {
        let result = '';
        groups.forEach(grp => result += `${grp.Id} ${grp.Name}\n`);
        await context.sendActivity(`Ваши подписки на каналы:\n ${result}`);
        return;
    }

    await context.sendActivity(`Вы ещё не подписались ни на один канал оповещений`);
}

async function createChannelSubscription({ context, message }) {
    const user = await getUser({ userId: context.activity.from.id });
    const groupId = getGroupId({ message, regex: addDeployEventToChannelWithIdRegex });
    let box = message.replace(/add_deploy_box/, '');
    console.log(box);
}

function getGroupId({ message, regex }) {
    let r = regex.exec(message);
    if (r && r[0]) {
        return r[1];
    }
}
async function sendHelp ({ context }) {
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
        '\\show_all_channels - отобразить текущие каналы\n' +
        '\\create_channel_"channelName" - создать новый канал оповещений\n' +
        '\\add_channel_{id} - подписаться на канал по Id\n' +
        '\\add_channel_"{ChannelName}" - подписаться на канал по названию\n' +
        `\\list_channels - каналы, подписка на которые активна\n` + 
        '\n' +
        '\n' +
        'более подробно https://confluence.mdtest.org/pages/viewpage.action?pageId=26280901'
    );
}

exports.EchoBot = EchoBot;
