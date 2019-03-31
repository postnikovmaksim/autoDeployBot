const _ = require('underscore');
const moment = require('moment');
const request = require('request-promise-native');
const { getSubscriptions, saveSubscriptions, removeSubscriptions } = require('./../subscriptionsServices');
const { saveError } = require('./../logService');
const WeekDay = require('./../enums/WeekDay');

const addRegx = /\\add_timeReport_\S+/;
const removeRegx = /\\remove_timeReport_\S+/;
const eventRegx = /timeReport_\S+/;

const username = 'restapi';
const password = 'aCkko5IQWxRZl3ROtppxRHReCdZMSQDd';
const sendTime = moment({ hours: 10, minutes: 0 });

module.exports = {
    async search ({ context, userId, message }) {
        if (message.search(addRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            await saveSubscriptions({ userId, eventName });
            await context.sendActivity(`Включена подписка на событие ${eventName}`);
            return true;
        }

        if (message.search(removeRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            await removeSubscriptions({ userId, eventName });
            await context.sendActivity(`Удалена подписка на событие ${eventName}`);
            return true;
        }

        return false;
    },

    async timeReportTask () {
        try {
            const now = moment();
            // если текущее время после момента отправки, поставить отправку отчета на следующий день
            // иначе на текущий день
            const addDay = sendTime.dayOfYear(now.dayOfYear()).isAfter(now) ? 1 : 0;

            const timeout = now.diff(sendTime.dayOfYear(now.dayOfYear() + addDay), 'milliseconds');
            setTimeout(async () => {
                await timeReportSend();
                this.timeReportTask();
            }, timeout)
        } catch (e) {
            saveError({ url: 'timeReportTask', error: e })
        }
    }
};

async function timeReportSend () {
    const day = moment().day();
    if (day === WeekDay.Sunday || day === WeekDay.Saturday) {
        return;
    }

    const subscriptions = await getSubscriptions({ eventPrefix: 'timeReport' });
    const userIds = _.uniq(subscriptions.map(x => x.userId));
    const users = userIds.map(userId => ({
        userId: userId,
        eventNames: subscriptions.filter(x => x.userId === userId).map(x => x.eventName)
    }));
    const usersYouTrack = await getUsers();
    await changeReport();
    await calculateReport();
    const reportYouTrack = await getTimeReport();

    users.forEach(x => {
        const works = x.eventNames.map(eventName => {
            const userLogin = eventName.replace(`timeReport_`, ``);
            const userYouTrack = usersYouTrack.find(u => u.login === userLogin);
            const report = reportYouTrack.find(report => report.userId === userYouTrack.ringId);
            return `**${userYouTrack.fullName}**\n${getWorkType(report)}`;
        });
        const message = `Отчет по времени:\n${works.join(`\n`)}`;

        sendMessageByUserId({ userId: x.userId, message })
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
            resolve(await getTimeReport())
        }

        resolve(result.data.groups[0].lines);
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

async function changeReport () {
    const url = 'https://youtrack.moedelo.org/youtrack/api/reports/98-850';
    const date = getDateLastWorkDay().valueOf();
    await request.post(url, {
        auth: {
            user: username,
            pass: password
        },
        body: {
            range: {
                '$type': 'jetbrains.youtrack.reports.impl.gap.ranges.FixedTimeRange',
                from: date,
                to: date
            }
        },
        json: true
    });
}

function getDateLastWorkDay () {
    const day = moment().day();

    if (day === WeekDay.Monday) {
        return moment().subtract(2, 'day');
    }

    return moment().subtract(1, 'day');
}
