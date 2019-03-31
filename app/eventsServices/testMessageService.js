const { sendMessage } = require('../dialogServices');
const { saveSubscriptions, removeSubscriptions } = require('../subscriptionsServices');

const addRegx = /\\add_test/;
const removeRegx = /\\remove_test/;

module.exports = {
    async search ({ context, userId, message }) {
        if (message.search(addRegx) === 0) {
            await saveSubscriptions({ userId, eventName: `test` });
            await context.sendActivity(`Включена подписка на событие test`);

            return true;
        }

        if (message.search(removeRegx) === 0) {
            await removeSubscriptions({ userId, eventName: `test` });
            await context.sendActivity(`Удалена подписка на событие test`);
            return true;
        }

        return false;
    },

    async testMessageEvent () {
        await sendMessage({ message: `Тестовое обращение обработано`, eventName: 'test' });
    }
};
