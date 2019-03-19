const moment = require('moment');
const { sendMessage } = require('../dialogServices');
const { saveEvent } = require('./commonEventServices');
const { sendToChannels } = require('./channelsSenderService');

module.exports = {
    async zabbixEvent ({ req }) {
        await saveEvent({
            name: 'zabbix_error',
            date: moment().add(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
            json: JSON.stringify(req.body)
        });

        if (req.body.problemResolvedTime) {
            await zabbixOkEvent({ req });
        } else {
            await zabbixErrorEvent({ req });
        }
    }
};

async function zabbixErrorEvent ({ req }) {
    const {
        problemStarted,
        problemDate,
        problemName,
        host,
        severity,
        tags
    } = req.body;

    const aplicatonName = getAplicatonName(tags);
    const message = `[${aplicatonName}] Обнаружена проблема ${problemStarted} ${problemDate}: ${problemName}\n` +
    `host: ${host}, severity: ${severity}`;

    await sendMessage({ message, eventName: `zabbix_${aplicatonName}` });
    await sendMessage({ message, eventName: `zabbix_all` });
    await sendToChannels({ message, eventName: `zabbix_${aplicatonName}`});
}

async function zabbixOkEvent ({ req }) {
    await saveEvent({
        name: 'zabbix_ok',
        date: moment().add(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        json: JSON.stringify(req.body)
    });

    const {
        problemResolvedTime,
        problemResolvedDate,
        problemName,
        problemAge,
        host,
        severity,
        tags
    } = req.body;

    const aplicatonName = getAplicatonName(tags);
    const message = `[${aplicatonName}] Решена проблема (время существования проблемы ${problemAge})\n` +
        `дата создания проблемы: ${problemResolvedTime} ${problemResolvedDate}\n` +
        `сообщение проблемы: ${problemName}\n` +
        `host: ${host}, severity: ${severity}`;

    await sendMessage({ message, eventName: `zabbix_${aplicatonName}` });
    await sendMessage({ message, eventName: `zabbix_all` });
}

function getAplicatonName (tags) {
    return tags.match(/Application:\S+,/)[0].replace('Application:', '').replace(',', '');
}
