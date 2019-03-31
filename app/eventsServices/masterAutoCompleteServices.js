const { sendMessage } = require('../dialogServices');
const { saveSubscriptions, removeSubscriptions } = require('../subscriptionsServices');

const addRegx = /\\add_master_auto_complete/;
const removeRegx = /\\remove_master_auto_complete/;

module.exports = {
    async search ({ context, userId, message }) {
        if (message.search(addRegx) === 0) {
            await saveSubscriptions({ userId, eventName: `master_auto_complete` });
            await context.sendActivity(`Включена подписка на событие master_auto_complete`);
            return true;
        }

        if (message.search(removeRegx) === 0) {
            await removeSubscriptions({ userId, eventName: `master_auto_complete` });
            await context.sendActivity(`Удалена подписка на событие master_auto_complete`);
            return true;
        }

        return false;
    },

    async consoleEvent ({ req }) {
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
        sendMessage({ message: text, eventName: `master_auto_complete` });
    }
};
