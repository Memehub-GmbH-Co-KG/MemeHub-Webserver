// Loads users from the users.json file
const fs = require('fs/promises');
/** The path of you nominated memes */
const file = process.env.MHA_USERS_PATH || '/users.json';
const users = {};
module.exports = users;

async function init() {
    try {
        const usersInFile = JSON.parse(await fs.readFile(file));
        for (const uuid in usersInFile)
            users[uuid] = usersInFile[uuid];
    }
    catch (error) {
        console.error("Failed to read users:");
        console.error(error);
        process.exit(9);
    }

    setTimeout(printReport, 100);
}

function printReport() {
    const count = Object.keys(users).length;
    console.log(`Got ${count} users.`);
}

init();