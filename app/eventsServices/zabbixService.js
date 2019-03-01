const moment = require('moment');
const { sendMessage } = require('../dialogServices');
const { saveEvent } = require('./commonEventServices');

module.exports = {
    async zabbixEvent ({ req }) {
        await saveEvent({
            name: 'zabbix_error',
            date: moment().add(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
            json: JSON.stringify(req.body)
        });

        if (req.body.problemResolvedTime) {
            await zabbixOkEvent({ req })
        }

        await zabbixErrorEvent({ req });
    }
};

async function zabbixErrorEvent ({ req }) {
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
    const message = `Обнаружена проблема ${problemResolvedTime} ${problemResolvedDate}: ${problemName}\n` +
    `host: ${host}, severity: ${severity}`;

    await sendMessage({ message, eventName: `zabbix_${aplicatonName}` });
    await sendMessage({ message, eventName: `zabbix_all` });
}

async function zabbixOkEvent ({ req }) {
    await saveEvent({
        name: 'zabbix_ok',
        date: moment().add(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        json: JSON.stringify(req.body)
    });

    const {
        problemStarted,
        problemDate,
        problemName,
        host,
        severity,
        tags
    } = req.body;

    const aplicatonName = getAplicatonName(tags);
    const message = `Решена проблемма\n` +
        `дата создания проблемы: ${problemStarted} ${problemDate}\n` +
        `сообщение проблемы: ${problemName}\n` +
        `host: ${host}, severity: ${severity}`;

    await sendMessage({ message, eventName: `zabbix_${aplicatonName}` });
    await sendMessage({ message, eventName: `zabbix_all` });
}

function getAplicatonName (tags) {
    return tags.match(/Application:\S+,/)[0].replace('Application:', '').replace(',', '');
}
