// Either starts the server or runs the report, based on the process args.
if (process.argv.length > 2 && process.argv[2] === 'report')
    require('./report.js');
else
    require('./server.js');