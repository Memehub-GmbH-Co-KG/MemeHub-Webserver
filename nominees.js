// Generates a nominees.json used for the MHA Webserver / Website based on a directory of memes
const fs = require('fs/promises');
const fetch = require('node-fetch');
/** The path of you nominated memes */
const dir = process.env.MHA_NOMINEES_PATH || '/nominees';
const nominees = {};
module.exports = nominees;

async function init() {
    try {
        for (category of await fs.readdir(dir)) {
            const files = await fs.readdir(dir + '/' + category)
            nominees[category] = await Promise.all(files
                .map(idFromFile)
                .filter(id => id !== undefined)
                .map(withMeta));
        }
    }
    catch (error) {
        console.error("Failed to read nominees:");
        console.error(error);
        process.exit(9);
    }

    setTimeout(printReport, 100);
}

/**
 * Parses the meme id from a file name. Returns undefined, if none can be found.
 * @param {string} file The file name 
 */
function idFromFile(file) {
    const match = file.match(/(?<=\[).+(?=\])/);

    if (!match || !match[0]) {
        console.log(`Failed to parse meme id from ${file}. Skipping.`);
        return undefined;
    }

    return match[0];
}


async function withMeta(id) {
    const response = await fetch(`${process.env.MEDIA_URL}/${id}/meta`);
    return await response.json();
}


function printReport() {
    const categories = Object.keys(nominees).length;
    const memes = Object.values(nominees)
        .map(cat => cat.length)
        .reduce((v1, v2) => v1 + v2, 0);
    console.log(`Got ${categories} categories with ${memes} nominees in total.`);
}

init();