const moment = require('moment');
const { sendMessage } = require('../dialogServices');

module.exports = {
    async stageDeployEvent ({ req }) {
        const {
            timeStump,
            successDeploy,
            errorDeploy
        } = req.body;

        const successMessages = successDeploy.map(app => `${app.applicationName}: успешно выложен\n ${app.applicationChanges.map(change => `* ${change}`).join(`\n`)}`);
        const errorMessages = errorDeploy.map(app => `**${app.applicationName}: произошла ошибка**`);

        const message = `${timeStump}\n${successMessages}\n\n${errorMessages.join(`\n`)}`;

        sendMessage({ message, eventName: `deploy_stage` });
    }
};
