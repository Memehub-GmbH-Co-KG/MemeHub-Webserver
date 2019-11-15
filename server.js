const Koa = require('koa');
const Router = require('koa-router');
const bodyparser = require('koa-bodyparser');
const cors = require('koa-cors');
const users = require('./users.json');
const nominees = require('./nominees.json');
const rs = require('rocket-store');
const app = new Koa();
const router = new Router();

rs.options({
    data_storage_area: "votes",
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

app.use(bodyparser({
    enableTypes: ['json'],
    jsonLimit: '128kb'
}));

router.get('/votes', async (ctx, next) => {
    const data = await rs.get('votes', ctx.state.user);
    if (data.count > 1) {
        console.log("Error while retrieving vote data: Multiple results for user " + ctx.user);
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

router.post('/votes', async (ctx, next) => {
    let votes = ctx.request.body;
    if (!areVotesValid(votes)) {
        ctx.status = 403;
        return;
    }

    rs.post('votes', ctx.state.user, votes);
    ctx.status = 200;
});


router.get('/user', async (ctx, next) => {
    ctx.body = { name: ctx.state.user };
    ctx.status = 200;
});

app
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(3040, () => {
    console.log('server started on http://localhost:3040');
})

function areVotesValid(votes) {
    for (const vote in votes) {
        if (!nominees[vote]) return false;
        if (!nominees[vote].some(n => n.id === votes[vote])) return false;
    }
    return true;
}