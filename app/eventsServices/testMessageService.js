const { sendMessage } = require('../dialogServices');

module.exports = {
    async testMessageEvent () {
        await sendMessage({ message: `Тестовое обращение обработано`, eventName: 'test' });
    }
};
