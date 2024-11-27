const express = require("express");
const Redis = require("ioredis");

const client = new Redis();

const PORT = process.env.PORT || 5000;

const app = express();

function setResponse(username,repos) {
    return `<h2>${username} has ${repos} Github Repos</h2>`
}

// cache middleware

async function cacheMiddleware(req, res, next) {
    const { username } = req.params;
    const cachedData = await client.get(username);
    if (cachedData) {
        console.log("Fetching data from cache...");
        res.send(setResponse(username, JSON.parse(cachedData)));
    } else {
        next();
    }
}

async function getRepos(req,res,next) {
    try {
        console.log("Fetching data....");
        const { username } = req.params;
        const response = await fetch(`http://api.github.com/users/${username}`);
        const data = await response.json();
        const repos = data.public_repos;
        client.set(username, JSON.stringify(repos));
        res.send(setResponse(username, repos));
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error fetching repositories");
    }
}

app.get('/repos/:username',cacheMiddleware,getRepos)

app.listen(5000, () => {
  console.log(`listening on port ${PORT}`);
});
