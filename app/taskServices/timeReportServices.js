const _ = require('underscore');
const request = require('request-promise-native');
const moment = require('./../libs/moment');
const { replaceHelp } = require('./../utils');
const { get, save, remove } = require('./../dao/subscriptionsServices');
const { saveError } = require('./../dao/logService');
const { sendMessageByUserId } = require('./../dialogServices');
const { getUser } = require('./../dao/userServices');
const WeekDay = require('./../enums/WeekDay');

const eventRegx = /time_report_\S+/;
const eventPrefix = 'time_report_';

const helpRegx = /help_time_report$/i;
const listRegx = /list_time_report$/i;
const addRegx = /add_time_report_\S+$/i;
const removeRegx = /remove_time_report_\S+$/i;
const getReportRegx = /get_time_report$/i;

const timeReportService = {
    getHelpMessage () {
        return `${replaceHelp(helpRegx)} - помощь раздела отчеты по времени`
    },

    getListMessage ({ userId }) {
        return getListMessage({ userId });
    },

    async search ({ context, userId, message }) {
        if (message.search(helpRegx) === 0) {
            await context.sendActivity(getHelpMessage());
            return true;
        }

        if (message.search(listRegx) === 0) {
            await context.sendActivity(await getListMessage({ userId }));
            return true;
        }

        if (message.search(addRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            const userName = eventName.replace(eventPrefix, '');

            if (!timeReportService.isValidName({ userName })) {
                await context.sendActivity(`Пользователь с логином **${userName}** не найден в youtrack`);
                return true;
            }

            const user = await getUser({ userId });
            const subscription = await get({ userId: user.id, eventName });
            if (subscription && subscription.length) {
                await context.sendActivity(`Подписка на пользователя **${userName}** уже существует`);
                return true;
            }

            await save({ userId, eventName });
            await context.sendActivity(`Включена подписка на отчеты для пользователя **${userName}**`);
            return true;
        }

        if (message.search(removeRegx) === 0) {
            const eventName = message.match(eventRegx)[0];
            const userName = eventName.replace(eventPrefix, '');

            const user = await getUser({ userId });
            const subscription = await get({ userId: user.id, eventName });
            if (!subscription || !subscription.length) {
                await context.sendActivity(`Подписки на пользователя **${userName}** не существует`);
                return true;
            }

            await remove({ userId, eventName });
            await context.sendActivity(`Удалена подписка на все события с перфиксом **${eventPrefix}**`);
            return true;
        }

        if (message.search(getReportRegx) === 0) {
            const user = await getUser({ userId });
            await timeReportSend({ userId: user.id });
            return true;
        }

        return false;
    },

    async isValidName ({ userName }) {
        const usersYouTrack = await getUsers();
        return usersYouTrack.find(u => u.login === userName);
    },

    async task () {
        try {
            const now = moment();
            const time = process.env.SendTimeReport.split(':');
            const sendTime = moment({ hours: time[0], minutes: time[1] });

            // если текущее время после момента отправки, поставить отправку отчета на следующий день
            // иначе на текущий день
            const addDay = sendTime.dayOfYear(now.dayOfYear()).isBefore(now) ? 1 : 0;

            const timeout = sendTime.dayOfYear(now.dayOfYear() + addDay).diff(now, 'milliseconds');
            setTimeout(async () => {
                await timeReportTaskSend();
                timeReportService.task();
            }, timeout)
        } catch (e) {
            saveError({ url: 'timeReportTask', error: e })
        }
    }
};

async function timeReportSend ({ userId }) {
    const subscriptions = await get({ userId, eventPrefix });
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

    const subscriptions = await get({ eventPrefix });
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
            const userLogin = eventName.replace(eventPrefix, ``);
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
            user: process.env.YouTrackLogin,
            pass: process.env.YouTrackPassword
        },
        json: true
    });
}

async function getTimeReport () {
    const url = 'https://youtrack.moedelo.org/youtrack/api/reports/98-850?$top=-1&fields=aggregationPolicy($type,field($type,id,presentation)),data(groups(lines(typeDurations(duration(presentation),workType),userId,userVisibleName)),perUser),status(calculationInProgress)&line=user';

    return new Promise(async resolve => {
        const result = await request.get(url, {
            auth: {
                user: process.env.YouTrackLogin,
                pass: process.env.YouTrackPassword
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
            user: process.env.YouTrackLogin,
            pass: process.env.YouTrackPassword
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
            user: process.env.YouTrackLogin,
            pass: process.env.YouTrackPassword
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

async function getListMessage ({ userId }) {
    const user = await getUser({ userId });
    const subscriptions = await get({ userId: user.id, eventPrefix });

    const list = subscriptions && subscriptions.length
        ? subscriptions.map(s => `-- ${s.eventName.replace(eventPrefix, '')}`).sort().join(`\n`)
        : `Нет действующих подписок`;

    return `**Подписки на отчеты по времени**:\n${list}`;
}

function getHelpMessage () {
    return `Подсказка для раздела **управление временем**\n` +
        `Раздел этого бота предназначен для управения отчетами из YouTrack о списаном рабочем времени\n` +
        `Каждый день в ${process.env.SendTimeReport} будет сформирован и отправлен отчет\n` +
        `Список команд:\n` +
        `${replaceHelp(helpRegx)} - подсказка раздела\n` +
        `${replaceHelp(listRegx)} - список действующих подписок\n` +
        `${replaceHelp(getReportRegx)} - показать отчет за предыдущий рабочий день\n` +
        `${replaceHelp(addRegx).replace(/\\S\+/, `{логин пользователя из YouTrack}`)} - подписаться на получени отчетов для конкретного пользователя\n` +
        `${replaceHelp(removeRegx).replace(/\\S\+/, `{логин пользователя из YouTrack}`)} - удалить подписку для конкретного пользователя`
}

module.exports = timeReportService;
