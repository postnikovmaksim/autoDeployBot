const { adapter } = require('./../../botFrameworkServices');
const { getReference, updateReference } = require('./../userServices');
const { getUserIds } = require('./../subscriptionsServices');
const { asyncForEach } = require('./../utils');

module.exports = {
    async consoleEvent ({ req }) {
        const ids = await getUserIds({ eventName: `master_auto_complete` });

        if (!ids.length) {
            return;
        }

        const messages = [];
        messages.push('*Отчёт о работе консоли:* \r\n');
        messages.push(`    Всего пользователей: ${req.body.totalUsers}\r\n` +
            `    Успешно: ${req.body.SuccessUsers}\r\n` +
            `    Не успешно: ${req.body.NotSuccessUsers}\r\n` +
            `    Количество исключений: ${req.body.ExceptionsCount}`);
        messages.push('*Статистика завершения мастеров:* \r\n');

        if (req.body.groupReportList) {
            Object.keys(req.body.groupReportList).forEach(async (message) => {
                messages.push(`    ${req.body.groupReportList[message]}: ${message}`)
            });
        }

        const text = messages.join('\r\n');
        const reference = await getReference({ ids });
        asyncForEach(reference, async reference => {
            await adapter.continueConversation(reference, async (context) => {
                try {
                    const reply = await context.sendActivity(text);
                    updateReference({ context, reply });
                } catch (e) {
                    console.log(e);
                }
            })
        })
    }
};
