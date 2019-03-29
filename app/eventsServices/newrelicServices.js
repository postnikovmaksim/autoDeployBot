const { sendMessage } = require('../dialogServices');

module.exports = {
    async newrelicEvent ({ req }) {
        const level = req.body.severity;
        const applicationName = req.body.targets[0].name;
        const details = req.body.details;
        const url = req.body.incident_url;

        const message = `${level} ${applicationName} ${details} ${url}`;

        sendMessage({ message, eventName: `newrelic_${applicationName}` });
        sendMessage({ message, eventName: `newrelic_all` });
    }
};
