const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const rs = require('rocket-store');
const nominees = require('./nominees.js');

rs.options({
    data_storage_area: process.env.MHA_DATA_PATH || '/data',
    data_format: rs._FORMAT_JSON
});

runReport();

async function runReport() {
    const votes = await rs.get('votes');
    const report = countVotes(votes);
    await printReport(report);
}

function createReportObject() {
    const report = {
        voters: 0,
        votes: 0,
        ignoredVoters: 0,
        categories: {}
    };
    for (const category in nominees) {
        report.categories[category] = {
            votes: 0,
            nominees: {}
        };
        for (const nominee of nominees[category]) {
            report.categories[category].nominees[nominee.id] = {
                votes: 0
            }
        }
    }
    return report;
}

function countVotes(votes) {
    const report = createReportObject();

    for (const vote of votes.result) {
        if (Object.keys(vote).length < 1) {
            report.ignoredVoters += 1;
            continue;
        }

        report.voters += 1;
        for (const category in vote) {
            const nominee = vote[category];
            if (!report.categories[category]) {
                console.log(`Votes contain unknown category "${category}"!`);
                continue;
            }

            if (!report.categories[category].nominees[nominee]) {
                console.log(`Votes contain unknown nominee "${nominee}"!`);
                continue;
            }

            report.votes += 1;
            report.categories[category].votes += 1
            report.categories[category].nominees[nominee].votes += 1;
        }
    }
    return report;
}

async function printReport(report) {
    const csvWriter = createCsvWriter({
        path: 'report.csv',
        alwaysQuote: false,
        fieldDelimiter: ",",
        header: [
            { id: 'id', title: 'id' },
            { id: 'category', title: 'category' },
            { id: 'votes', title: 'votes' }
        ]
    });
    const csv = [];

    console.log("\n=== Vote Report ===\n");
    console.log(` Total amount of votes cast      : ${report.votes}`);
    console.log(` Total amount of users who voted : ${report.voters}`);
    console.log(` Total amount of ignored users   : ${report.ignoredVoters}`);
    for (const categoryName in report.categories) {
        const category = report.categories[categoryName];
        console.log(`\n${categoryName}\n`);
        console.log(`  Total amount of votes cast: ${category.votes}\n`);

        const sortedNominees = Object.keys(category.nominees).map(n => ({ id: n, votes: category.nominees[n].votes })).sort((a, b) => b.votes - a.votes);
        for (const nominee of sortedNominees) {
            const percentage = (nominee.votes / category.votes * 100).toFixed(1) + "%";
            console.log(`  ${nominee.id.padEnd(63)} : ${nominee.votes.toString().padEnd(3)} (${percentage.padStart(6)})`);
            csv.push({ id: nominee.id, category: categoryName, votes: nominee.votes });
        }
    }

    await csvWriter.writeRecords(csv);
}
