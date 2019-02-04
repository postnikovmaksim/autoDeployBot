const { getActivitys } = require('./userServices');
const { getUserIds } = require('./subscriptionsServices');

module.exports = {
    async consoleEvent ({ req, adapter }) {
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
        const activities = await getActivitys({ ids });
        activities.forEach(async (reference) => {
            await adapter.continueConversation(reference, async (context) => {
                await context.sendActivity(text);
            })
        })
    }
};
