const { sendMessage } = require('../dialogServices');

module.exports = {
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
