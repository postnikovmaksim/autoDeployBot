const moment = require('moment');
const { sendMessage } = require('../dialogServices');

const SUCCESS = 'SUCCESS';

module.exports = {
    async stageDeployEvent ({ req }) {
        const request = JSON.parse(new Buffer.from(req.body.data, 'base64').toString('utf8'));

        const result = joinFrontAndBack(request)
            .map(({ name, status, changes }) => {
                if (status === SUCCESS) {
                    return changes && changes.length > 0
                        ? `${name}: успешно выложен\n ${getChangesString(changes)}`
                        : null;
                }

                return `(fire)**${name}: произошла ошибка**`
            }).filter(app => !!app);

        const timeStump = moment().format('HH:mm DD-mm-YYYY');
        const message = `${timeStump}\n${result.join(`\n`)}`;

        console.log(message);
        sendMessage({ message, eventName: `deploy_stage` });
    }
};

function joinFrontAndBack (apps) {
    return apps.map(app => {
        const isBack = app.name.search(/\S+Back/) >= 0;
        const appName = app.name.replace(/Net_Deploy_\S+_/, '');

        if (!isBack && app.name.search(/\S+Front/) === -1) {
            return { ...app, name: appName };
        }

        const twinApp = isBack
            ? apps.find(({ name }) => app.name.replace('Back', 'Front') === name)
            : apps.find(({ name }) => app.name.replace('Front', 'Back') === name);

        if (twinApp && app.status === SUCCESS && twinApp.status === SUCCESS) {
            return isBack
                ? { ...app, name: `${appName} and Front` }
                : null
        }

        return { ...app, name: appName };
    }).filter(app => !!app);
}

function getChangesString (changes) {
    return changes.map(change => {
        const text = change.search(/\n\n*/) >= 0
            ? change.match(/.+\n\n*/)[0].replace(/\n\n*/, '')
            : change.replace(/\n/, '');

        console.log(text);
        return `* ${text}`;
    }).join(`\n`) + '\n\n';
}
