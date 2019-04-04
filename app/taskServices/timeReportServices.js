const _ = require('underscore');
const moment = require('moment');
const request = require('request-promise-native');
const { getSubscriptions, saveSubscriptions, removeSubscriptions } = require('./../subscriptionsServices');
const { saveError } = require('./../logService');
const { sendMessageByUserId } = require('./../dialogServices');
const { getUser } = require('./../userServices');
const WeekDay = require('./../enums/WeekDay');

const eventRegx = /time_report_\S+/;
const help = /\\help_time_report/;
const list = /\\list_time_report/;
const getReport = /\\get_time_report/;
const addRegx = /\\add_time_report_\S+/;
const removeRegx = /\\remove_time_report_\S+/;

const username = 'restapi';
const password = 'aCkko5IQWxRZl3ROtppxRHReCdZMSQDd';
const sendTime = moment({ hours: 10, minutes: 0 }).subtract(3, 'hour');

const timeReportService = {
    async search ({ context, userId, message }) {
        if (message.search(help) === 0) {
            await context.sendActivity(getHelpMessage());
            return true;
        }

        if (message.search(addRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            const usersYouTrack = await getUsers();
            const userName = eventName.replace('time_report_', '');
            if (!usersYouTrack.find(u => u.login === userName)) {
                await context.sendActivity(`Пользователь с логином **${userName}** не найден в youtrack`);
                return true;
            }

            await saveSubscriptions({ userId, eventName });
            await context.sendActivity(`Включена подписка на событие **${eventName}**`);
            return true;
        }

        if (message.search(removeRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            await removeSubscriptions({ userId, eventName });
            await context.sendActivity(`Удалена подписка на событие **${eventName}**`);
            return true;
        }

        if (message.search(getReport) === 0) {
            const user = await getUser({ userId });
            await timeReportSend({ userId: user.id });
            return true;
        }

        return false;
    },

    async timeReportTask () {
        try {
            const now = moment();
            // если текущее время после момента отправки, поставить отправку отчета на следующий день
            // иначе на текущий день
            const addDay = sendTime.dayOfYear(now.dayOfYear()).isBefore(now) ? 1 : 0;

            const timeout = sendTime.dayOfYear(now.dayOfYear() + addDay).diff(now, 'milliseconds');
            setTimeout(async () => {
                await timeReportTaskSend();
                timeReportService.timeReportTask();
            }, timeout)
        } catch (e) {
            saveError({ url: 'timeReportTask', error: e })
        }
    }
};

async function timeReportSend ({ userId }) {
    const subscriptions = await getSubscriptions({ userId, eventPrefix: 'time_report' });
    const user = {
        userId: userId,
        eventNames: subscriptions.filter(x => x.userId === userId).map(x => x.eventName)
    };
    await send({ users: [user] });
}

async function timeReportTaskSend () {
    const day = moment().day();
    if (day === WeekDay.Sunday || day === WeekDay.Saturday) {
        return;
    }

    const subscriptions = await getSubscriptions({ eventPrefix: 'time_report' });
    const userIds = _.uniq(subscriptions.map(x => x.userId));
    const users = userIds.map(userId => ({
        userId: userId,
        eventNames: subscriptions.filter(x => x.userId === userId).map(x => x.eventName)
    }));
    await send({ users });
}

async function send ({ users }) {
    const usersYouTrack = await getUsers();
    const date = getDateLastWorkDay();
    await changeReport({ date });
    await calculateReport();
    const reportYouTrack = await getTimeReport();

    users.forEach(x => {
        const works = x.eventNames.map(eventName => {
            const userLogin = eventName.replace(`time_report_`, ``);
            const userYouTrack = usersYouTrack.find(u => u.login === userLogin);
            const report = reportYouTrack.find(report => report.userId === userYouTrack.ringId);
            return `**${userYouTrack.fullName}**\n${getWorkType(report)}`;
        });
        const message = `Отчет по времени за ${date.format('DD.MM.YYYY')}:\n${works.join(`\n`)}`;

        sendMessageByUserId({ message, id: x.userId })
    });
}

function getWorkType (report) {
    if (!report || !report.typeDurations) {
        return `время не списано`
    }
    return report.typeDurations.map(x => `${x.workType}: ${x.duration.presentation}`).join(`\n`);
}

async function getUsers () {
    // берем 2000 сотрудников, на момент написания было 835 сотрудников в системе
    // todo переписать на неограниченное колличество
    const url = 'https://youtrack.moedelo.org/youtrack/api/admin/users?$skip=0&$top=2000&fields=login,ringId,fullName';
    return request.get(url, {
        auth: {
            user: username,
            pass: password
        },
        json: true
    });
}

async function getTimeReport () {
    const url = 'https://youtrack.moedelo.org/youtrack/api/reports/98-850?$top=-1&fields=aggregationPolicy($type,field($type,id,presentation)),data(groups(lines(typeDurations(duration(presentation),workType),userId,userVisibleName)),perUser),status(calculationInProgress)&line=user';

    return new Promise(async resolve => {
        const result = await request.get(url, {
            auth: {
                user: username,
                pass: password
            },
            json: true
        });

        if (result.status.calculationInProgress) {
            setTimeout(async () => {
                resolve(await getTimeReport())
            }, 100);
        } else {
            resolve(result.data.groups[0].lines);
        }
    });
}

async function calculateReport () {
    const url = 'https://youtrack.moedelo.org/youtrack/api/reports/98-850/status';
    await request.post(url, {
        auth: {
            user: username,
            pass: password
        },
        body: {
            calculationInProgress: true
        },
        json: true
    });
}

async function changeReport ({ date }) {
    const url = 'https://youtrack.moedelo.org/youtrack/api/reports/98-850';
    await request.post(url, {
        auth: {
            user: username,
            pass: password
        },
        body: {
            range: {
                '$type': 'jetbrains.youtrack.reports.impl.gap.ranges.FixedTimeRange',
                from: date.valueOf(),
                to: date.valueOf()
            }
        },
        json: true
    });
}

function getDateLastWorkDay () {
    const day = moment().day();

    if (day === WeekDay.Monday) {
        return moment().subtract(3, 'day');
    }

    return moment().subtract(1, 'day');
}

function getHelpMessage () {
    return `Подсказка для раздела **управление временем**\n
    Список команд:\n
    \\`
}

module.exports = timeReportService;
