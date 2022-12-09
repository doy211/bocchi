const { REST } = require('@discordjs/rest')
const { Client, Intents } = require('discord.js')
const { Routes } = require('discord-api-types/v9')
const client = new Client({
    autoReconnect: true,
    retryLimit: Infinity,
    presence: {
        status: "idle",
    },
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]
})
const { generateDependencyReport } = require('@discordjs/voice');

const fs = require('fs');
const path = require('path');

let commandTmp = [];
let commands = [];

require('dotenv').config({
    path: path.join(__dirname, '.env'),
});

const token =
    process.env.NODE_ENV === 'development'
        ? process.env.TOKEN_DEV
        : process.env.TOKEN_PROD

client.once('ready', () => {
    console.log('Bot Ready!');
    console.log(generateDependencyReport());

    let commandsFiles = fs.readdirSync(path.join(__dirname, './commands'))

    commandsFiles.forEach((file, i) => {
        commandTmp[i] = require('./commands/' + file)
        commands = [
            ...commands,
            {
                name: file.split('.')[0],
                description: commandTmp[i].description,
                init: commandTmp[i].init,
                options: commandTmp[i].options,
            },
        ]
    })

    const rest = new REST({ version: '10' }).setToken(token)
    rest.put(Routes.applicationCommands(client.application.id), {
        body: commands,
    })
        .then(() => {
            console.log('Commands registered!')
        })
        .catch(console.error)
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return
    const { commandName } = interaction
    const selectedCommand = commands.find(c => commandName === c.name)
    selectedCommand.init(interaction, client)
})

client.login(token);

// app service startup
const http = require('http');
const server = http.createServer((req, res) => { 
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('ok');
});
server.listen(process.env.PORT, () => { 
    console.log('app service startup');
});