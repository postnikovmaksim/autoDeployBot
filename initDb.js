const { query } = require('./app/mysqlServices');

(async () => {
    try {
        await query({
            sqlString: `CREATE TABLE \`users\` (
                      \`id\` mediumint(9) NOT NULL AUTO_INCREMENT,
                      \`userId\` varchar(100) NOT NULL,
                      \`userName\` varchar(100) DEFAULT NULL,
                      \`activity\` text NOT NULL,
                      PRIMARY KEY (\`id\`)
                    ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;`
        });
    } catch (e) {
        console.log(e);
    }

    try {
        await query({
            sqlString: `CREATE TABLE \`userssubscriptions\` (
                      \`id\` mediumint(9) NOT NULL AUTO_INCREMENT,
                      \`userId\` mediumint(9) NOT NULL,
                      \`eventName\` varchar(100) NOT NULL,
                      PRIMARY KEY (\`id\`),
                      KEY \`userId\` (\`userId\`),
                      CONSTRAINT \`UsersSubscriptions_ibfk_1\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`)
                    ) ENGINE=InnoDB AUTO_INCREMENT=261 DEFAULT CHARSET=utf8;`
        });
    } catch (e) {
        console.log(e);
    }

    try {
        await query({
            sqlString: `CREATE TABLE \`events\` (
                      \`id\` mediumint(9) NOT NULL AUTO_INCREMENT,
                      \`name\` varchar(100) NOT NULL,
                      \`date\` datetime NOT NULL,
                      \`json\` text NOT NULL,
                      PRIMARY KEY (\`id\`)
                    ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;`
        })
    } catch (e) {
        console.log(e);
    }

    //channels
    try {
        await query({ 
            sqlString: `CREATE TABLE \`channels\` (
                \`Id\` mediumint(9) NOT NULL AUTO_INCREMENT,
                \`Name\` varchar(100) NOT NULL,
                PRIMARY KEY (\`Id\`)
              ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8`
        })
    } catch (e) {
        console.log(e);
    }

    //channelsUsers
    try {
        await query({
            sqlString: `CREATE TABLE \`channelsusers\` (
                \`Id\` mediumint(9) NOT NULL AUTO_INCREMENT,
                \`ChannelId\` mediumint(9) NOT NULL,
                \`UserId\` mediumint(9) NOT NULL,
                PRIMARY KEY (\`Id\`),
                UNIQUE KEY \`UX_ChannelsUsers_ChannelId_UserId\` (\`ChannelId\`,\`UserId\`),
                KEY \`FK_ChannelsUsers_Users_idx\` (\`UserId\`),
                KEY \`FK_ChannelsUsers_Channels_idx\` (\`ChannelId\`),
                CONSTRAINT \`FK_ChannelsUsers_Channels\` FOREIGN KEY (\`ChannelId\`) REFERENCES \`channels\` (\`Id\`)
              ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8`
        })
    } catch (e) {
        console.log(e);
    }

    //channelsSubscriptions
    try {
        await query({
            sqlString: `CREATE TABLE \`channelssubscriptions\` (
                \`id\` mediumint(9) NOT NULL AUTO_INCREMENT,
                \`channelId\` mediumint(9) NOT NULL,
                \`eventName\` varchar(100) NOT NULL,
                PRIMARY KEY (\`id\`),
                KEY \`channelId\` (\`channelId\`),
                CONSTRAINT \`FK_ChannelsSubscriptions_Channels_ChannelId\` FOREIGN KEY (\`ChannelId\`) REFERENCES \`channels\` (\`id\`)
              ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8`
        })
    } catch (e) {
        console.log(e);
    }

})();
