const { getActivitys } = require('./userServices');
const { getUserIds } = require('./subscriptionsServices');

module.exports = {
    async consoleEvent ({ req, adapter }) {
        console.log(req.body);
        const ids = await getUserIds({ eventName: `MasterAutoComplete` });

        if (!ids.length) {
            return;
        }

        const activities = await getActivitys({ ids });
        activities.forEach(async (reference) => {
            await adapter.continueConversation(reference, async (context) => {
                console.log(` continueConversation = true`);
                const messages = [];
                messages.push('*Отчёт о работе консоли:* \r\n');
                messages.push(`    Всего пользователей: ${req.body.totalUsers}\r\n` +
                    `    Успешно: ${req.body.SuccessUsers}\r\n` +
                    `    Не успешно: ${req.body.NotSuccessUsers}\r\n` +
                    `    Количество исключений: ${req.body.ExceptionsCount}`);
                messages.push('*Статистика завершения мастеров:* \r\n');
                Object.keys(req.body.groupReportList).forEach(async (message) => {
                    messages.push(`    ${req.body.groupReportList[message]}: ${message}`)
                });
                await context.sendActivity(messages.join('\r\n'));
            })
        })
    }
};
