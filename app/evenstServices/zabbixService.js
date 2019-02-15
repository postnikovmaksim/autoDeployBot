const { sendMessage } = require('../dialogServices');

module.exports = {
    async zabbixErrorEvent ({ req }) {
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

        await sendMessage({ message });
    },

    async zabbixOkEvent ({ req }) {
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

        await sendMessage({ message });
    }
};
