const moment = require('moment');
const { sendMessage } = require('../dialogServices');
const { saveEvent } = require('./commonEventServices');

module.exports = {
    async zabbixErrorEvent ({ req }) {
        await saveEvent({
            name: 'zabbix_error',
            date: moment(),
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

        const message = `Обнаружена проблема ${problemResolvedTime} ${problemResolvedDate}: ${problemName}\n` +
        `host: ${host}, severity: ${severity}, tags${JSON.stringify(tags)}, app:${tags.Application}`;

        await sendMessage({ message, eventName: `zabbix_${tags.Application}` });
        await sendMessage({ message, eventName: `zabbix_all` });
    },

    async zabbixOkEvent ({ req }) {
        await saveEvent({
            name: 'zabbix_ok',
            date: moment(),
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

        const message = `Решена проблемма\n` +
            `дата создания проблемы: ${problemStarted} ${problemDate}\n` +
            `сообщение проблемы: ${problemName}\n` +
            `host: ${host}, severity: ${severity}, tags${JSON.stringify(tags)}, app:${tags.Application}`;

        await sendMessage({ message, eventName: `zabbix_${tags.Application}` });
        await sendMessage({ message, eventName: `zabbix_all` });
    }
};
