const { query } = require('./app/mysqlServices');

(async () => {
    try {
        await query({
            sqlString: `CREATE TABLE \`users\` (
                      \`id\` mediumint(9) NOT NULL AUTO_INCREMENT,
                      \`user_id\` varchar(100) NOT NULL,
                      \`user_name\` varchar(100) DEFAULT NULL,
                      \`activity\` text NOT NULL,
                      PRIMARY KEY (\`id\`),
                      KEY \`KEY_users_users_idx\` (\`user_id\`) 
                    ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;`
        });
    } catch (e) {
        console.log(e);
    }

    try {
        await query({
            sqlString: `CREATE TABLE \`users_subscriptions\` (
                      \`id\` mediumint(9) NOT NULL AUTO_INCREMENT,
                      \`user_id\` mediumint(9) NOT NULL,
                      \`event_name\` varchar(100) NOT NULL,
                      PRIMARY KEY (\`id\`),
                      CONSTRAINT \`FK_users_subscriptions_users\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
                    ) ENGINE=InnoDB AUTO_INCREMENT=261 DEFAULT CHARSET=utf8;`
        });
    } catch (e) {
        console.log(e);
    }

    try {
        await query({
            sqlString: `CREATE TABLE \`requests\` (
                      \`id\` mediumint(9) NOT NULL AUTO_INCREMENT,
                      \`url\` varchar(1000) NOT NULL,
                      \`date\` datetime NOT NULL,
                      \`json\` text NOT NULL,
                      PRIMARY KEY (\`id\`)
                    ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;`
        })
    } catch (e) {
        console.log(e);
    }

    try {
        await query({
            sqlString: `CREATE TABLE \`errors\` (
                      \`id\` mediumint(9) NOT NULL AUTO_INCREMENT,
                      \`url\` varchar(1000) NOT NULL,
                      \`date\` datetime NOT NULL,
                      \`json\` text NOT NULL,
                      PRIMARY KEY (\`id\`)
                    ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;`
        })
    } catch (e) {
        console.log(e);
    }

    try {
        await query({
            sqlString: `CREATE TABLE \`channels\` (
                \`id\` mediumint(9) NOT NULL AUTO_INCREMENT,
                \`name\` varchar(100) NOT NULL,
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8`
        })
    } catch (e) {
        console.log(e);
    }

    try {
        await query({
            sqlString: `CREATE TABLE \`channels_users\` (
                \`id\` mediumint(9) NOT NULL AUTO_INCREMENT,
                \`channel_id\` mediumint(9) NOT NULL,
                \`user_id\` mediumint(9) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UX_channels_users_channel_id_user_id\` (\`channel_id\`,\`user_id\`),
                KEY \`FK_channels_users_users_idx\` (\`user_id\`),
                KEY \`FK_channels_users_channels_idx\` (\`channel_id\`),
                CONSTRAINT \`FK_channels_users_channels\` FOREIGN KEY (\`channel_id\`) REFERENCES \`channels\` (\`id\`)
              ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8`
        })
    } catch (e) {
        console.log(e);
    }

    try {
        await query({
            sqlString: `CREATE TABLE \`channels_subscriptions\` (
                \`id\` mediumint(9) NOT NULL AUTO_INCREMENT,
                \`channel_id\` mediumint(9) NOT NULL,
                \`event_name\` varchar(100) NOT NULL,
                PRIMARY KEY (\`id\`),
                KEY \`FK_channels_users_channels_idx\` (\`channel_id\`),
                CONSTRAINT \`FK_channels_subscriptions_channels_channel_id\` FOREIGN KEY (\`channel_id\`) REFERENCES \`channels\` (\`id\`)
              ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8`
        })
    } catch (e) {
        console.log(e);
    }
})();
