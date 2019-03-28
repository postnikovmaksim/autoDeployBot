const { sendMessage } = require('../dialogServices');

module.exports = {
    async zabbixEvent ({ req }) {
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
}

async function zabbixOkEvent ({ req }) {
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
