const Koa = require('koa');
const Router = require('koa-router');
const bodyparser = require('koa-bodyparser');
const cors = require('@koa/cors');
const users = require('./users.js');
const nominees = require('./nominees.js');
const rs = require('rocket-store');
const app = new Koa();
const router = new Router();

rs.options({
    data_storage_area: process.env.MHA_DATA_PATH || '/data',
    data_format: rs._FORMAT_JSON
});

app.use(cors());

// check for token
app.use(async (ctx, next) => {
    let token = ctx.query.token;
    if (!token) {
        ctx.status = 400;
        return;
    }

    ctx.state.token = token;
    await next();
});

// check for user
app.use(async (ctx, next) => {
    let user = users[ctx.state.token];
    if (!user) {
        ctx.status = 401;
        return;
    }

    ctx.state.user = user;
    await next();
});

// Parse body as json
app.use(bodyparser({
    enableTypes: ['json'],
    jsonLimit: '128kb'
}));

// Returns the votes that are stored for the user.
router.get('/votes', async (ctx, next) => {
    const data = await rs.get('votes', ctx.state.user.id);
    if (data.count > 1) {
        console.log("Error while retrieving vote data: Multiple results for user " + ctx.state.user.id);
        ctx.status = 500;
        return;
    }

    if (data.count == 0) {
        ctx.body = {};
        ctx.status = 200;
        return;
    }

    const votes = data.result[0];
    ctx.body = votes;
    ctx.status = 200;
});

// Overwrites the votes of the user.
router.post('/votes', async (ctx, next) => {
    let votes = ctx.request.body;
    if (!areVotesValid(votes)) {
        ctx.status = 403;
        return;
    }

    rs.post('votes', ctx.state.user.id, votes);
    ctx.status = 200;
});

// Returns the name of the user.
router.get('/user', async (ctx, next) => {
    ctx.body = { name: ctx.state.user.name };
    ctx.status = 200;
});

// Returns all categories and nominees
router.get('/nominees', async (ctx, next) => {
    ctx.body = nominees;
});

app
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(80, () => {
    console.log('server started on http://localhost:80');
});

/**
 * Checks if a votes object is valid. Keys are categories and values are meme ids.
 * @param {object} votes The votes to check
 */
function areVotesValid(votes) {
    for (const category in votes) {
        if (!nominees[category]) return false;
        if (!nominees[category].some(n => n.id === votes[category])) return false;
    }
    return true;
}