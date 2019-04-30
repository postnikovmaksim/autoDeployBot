const request = require('request-promise-native');
const moment = require('./../libs/moment');
const { replaceHelp } = require('./../utils');

const helpRegx = /help_issue$/i;
const getBlockedIssueRegx = /get_blocked_issue$/i;

const blockedTagId = `95-866`;

module.exports = {
    getHelpMessage () {
        return `${replaceHelp(helpRegx)} - помощь раздела "задачи из YouTrack"`
    },

    async search ({ context, message }) {
        if (message.search(helpRegx) === 0) {
            await context.sendActivity(getHelpMessage());
            return true;
        }

        if (message.search(getBlockedIssueRegx) === 0) {
            const message = await getBlockedIssueMessage();
            await context.sendActivity(message);
            return true;
        }

        return false;
    }
};

function getHelpMessage () {
    return `Подсказка для раздела **задачи из YouTrack**\n` +
        `Список команд:\n` +
        `${replaceHelp(helpRegx)} - подсказка раздела\n` +
        `${replaceHelp(getBlockedIssueRegx)} - показать статистику по заблокированным задачам\n`;
}

async function getBlockedIssueMessage () {
    const issues = await getBlockedIssue();
    const tasks = issues.map(issue => getBlockedTime({ issueId: issue.id }));

    const blockedTimes = await Promise.all(tasks);

    return issues.map((issue, index) => ({ ...issue, ...blockedTimes[index] }))
        .sort((a, b) => {
            if (a.lastDuration > b.lastDuration) return -1;
            if (a.lastDuration < b.lastDuration) return 1;
            return 0
        }).map(issue => `[${issue.name}](${issue.link})\n` +
        `Всего блокирована: ${moment.duration(issue.totalDuration, 'ms').humanize()}\n` +
        `Последний раз установлен ${moment.duration(-issue.lastDuration, 'ms').humanize(true)}`).join('\n\n');
}

async function getBlockedIssue () {
    const url = 'https://youtrack.moedelo.org/youtrack/api/issues?query=tag:%20blocked&fields=id,project(shortName),numberInProject,summary';
    const result = await request.get(url, {
        auth: {
            user: process.env.YouTrackLogin,
            pass: process.env.YouTrackPassword
        },
        json: true
    });

    return result.map(issue => ({
        id: issue.id,
        name: `${issue.project.shortName}-${issue.numberInProject} ${issue.summary}`,
        link: `https://youtrack.moedelo.org/youtrack/issue/${issue.project.shortName}-${issue.numberInProject}`
    }))
}

async function getBlockedTime ({ issueId }) {
    const url = `https://youtrack.moedelo.org/youtrack/api/issues/${issueId}/activities?fields=timestamp,added(id,name),removed(id,name)&categories=TagsCategory`;
    const result = await request.get(url, {
        auth: {
            user: process.env.YouTrackLogin,
            pass: process.env.YouTrackPassword
        },
        json: true
    });

    const sortActions = result
        .filter(action => !!action.added.find(tag => tag.id === blockedTagId) || !!action.removed.find(tag => tag.id === blockedTagId))
        .sort((a, b) => {
            if (a.timestamp < b.timestamp) return -1;
            if (a.timestamp > b.timestamp) return 1;
            return 0
        });

    const removedActions = sortActions.filter(action => !!action.removed.find(tag => tag.id === blockedTagId));
    const addedActions = sortActions.filter(action => !!action.added.find(tag => tag.id === blockedTagId));

    const lastDuration = +moment().format('x') - sortActions[sortActions.length - 1].timestamp;

    return {
        lastDuration: lastDuration,
        totalDuration: removedActions
            .map((action, index) => action.timestamp - addedActions[index].timestamp)
            .reduce((sum, current) => sum + current, lastDuration)
    }
}
