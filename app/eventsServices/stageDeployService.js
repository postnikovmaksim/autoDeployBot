const moment = require('moment');
const { sendMessage } = require('../dialogServices');

const SUCCESS = 'SUCCESS';
const formatDate = 'HH:mm DD-MM-YYYY';

module.exports = {
    async stageDeployEvent ({ req }) {
        const request = JSON.parse(new Buffer.from(req.body.data, 'base64').toString('utf8'));

        const errors = [];
        const result = joinFrontAndBack(request)
            .map(({ name, status, changes }) => {
                if (status === SUCCESS) {
                    return changes && changes.length > 0
                        ? `**${name}**: успешно выложен\n${getChangesString(changes)}\n`
                        : null;
                }

                errors.push(`(fire)**${name}: произошла ошибка**\n${getChangesString(changes)}\n`);
                return null;
            }).filter(app => !!app);

        const timeStump = moment().format(formatDate);
        const message = `${timeStump} StageDeploy\n${errors.join('\n')}${result.join(`\n`)}`;

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
    return changes.map(({ comment, user, date }) => {
        const text = comment.search(/\n\n*/) >= 0
            ? comment.match(/.+\n\n*/)[0].replace(/\n\n*/, '')
            : comment.replace(/\n/, '');

        console.log(text);
        return `-- ${text} (${user} ${moment(date).format(formatDate)})`;
    }).join(`\n`);
}
