const moment = require('moment');
const { sendMessage } = require('../dialogServices');
const { saveEvent } = require('./commonEventServices');

module.exports = {
    async newrelicEvent ({ req }) {
        await saveEvent({
            name: 'newrelic',
            date: moment(),
            json: JSON.stringify(req.body)
        });

        const level = req.body.severity;
        const applicationName = req.body.targets[0].name;
        const details = req.body.details;
        const url = req.body.incident_url;

        const message = `${level} ${applicationName} ${details} ${url}`;

        sendMessage({ message, eventName: `newrelic_${applicationName}` });
    }
};
