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
})();
