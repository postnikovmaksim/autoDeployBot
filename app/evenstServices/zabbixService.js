const { adapter } = require('./../../botFrameworkServices');
const { getReference, updateReference } = require('./../userServices');
const { getUserIds } = require('./../subscriptionsServices');
const { asyncForEach } = require('./../utils');

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

async function sendMessage ({ message }) {
    const ids = await getUserIds({ eventName: `zabbix` });
    if (!ids.length) {
        return;
    }

    const reference = await getReference({ ids });
    asyncForEach(reference, async reference => {
        await adapter.continueConversation(reference, async (context) => {
            try {
                const reply = await context.sendActivity(message);
                updateReference({ context, reply });
            } catch (e) {
                console.log(e);
            }
        })
    })
}
