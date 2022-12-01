const DiscordJS = require('discord.js');
const ytdl = require('ytdl-core-discord');
const { createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const STRING = DiscordJS.Constants.ApplicationCommandOptionTypes.STRING;

const description = 'Send a pong message to check if the bot is on.';

const options = [
    {
        name: 'url',
        description: 'youtube url',
        required: true,
        type: STRING,
    }
];

const init = async (interaction, client) => {
    const { options, guild, member } = interaction;
    // if you have not disabled caching 
    let channels = Array.from(guild.channels.cache.values());
    if (!channels) {
        channels = Array.from((await guild.channels.fetch()).values());
    }

    const voiceChannel = channels.filter(c => c.type === 'GUILD_VOICE' && c.members.get(member.user.id) != null)[0];
    const connection = getVoiceConnection(voiceChannel.guild.id);
    const url = interaction.options.getString('url');
    const music = await ytdl(url);

    const player = createAudioPlayer();

    const subscription = connection.subscribe(player);
    if (subscription) {
        setTimeout(() => subscription.unsubscribe(), 5_000);
    }

    const resource = createAudioResource(music);
    player.play(resource);

    player.on('error', error => {
        console.error(error);
    });

    interaction.reply('play!');
};

module.exports = { init, description, options }
