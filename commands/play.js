const DiscordJS = require('discord.js');
const ytdl = require('ytdl-core-discord');
const { createAudioPlayer, createAudioResource, getVoiceConnection, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const STRING = DiscordJS.Constants.ApplicationCommandOptionTypes.STRING;
const QueueService = require('./../queue/queue.service.js');

const description = '음악을 재생합니다.';

const options = [
    {
        name: 'url',
        description: 'youtube url',
        required: true,
        type: STRING,
    }
];

const getMusic = async (id) => {
    const queue = await QueueService.getQueue(id);
    if (queue.length === 0) {
        return [null, null];
    }

    const url = queue.shift();
    await QueueService.setQueue(id, queue);

    const musicInfo = await ytdl.getBasicInfo(url);
    const music = await ytdl(url, { quality: 'highestaudio' });
    const resource = createAudioResource(music);

    return [resource, musicInfo];
}

const playMusic = async (voiceChannel, player) => {
    let connection = getVoiceConnection(voiceChannel.guildId);
    if (!connection) {
        connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
    }

    const subscription = connection.subscribe(player);
    // if (subscription) {
    //     setTimeout(() => subscription.unsubscribe(), 5_000);
    // }

    const [music, musicInfo] = await getMusic(voiceChannel.guildId);
    player.play(music);
    interaction.reply(`노래를 재생할게요!\n${musicInfo.videoDetails.video_url}`);
}

const init = async (interaction, client) => {
    const url = interaction.options.getString('url');
    const { options, guild, member } = interaction;

    let channels = Array.from(guild.channels.cache.values());
    if (!channels) {
        channels = Array.from((await guild.channels.fetch()).values());
    }

    const voiceChannel = channels.filter(c => c.type === 'GUILD_VOICE' && c.members.get(member.user.id) != null)[0];
    if (!voiceChannel) {
        interaction.reply(`음성 채널을 찾는 데에 실패했어요!`);
        return;
    }

    const queue = await QueueService.getQueue(guild.id);
    queue.push(url);
    await QueueService.setQueue(guild.id, queue);
    
    const player = createAudioPlayer();

    player.on('error', error => {
        console.error(error);
    });

    player.on(AudioPlayerStatus.Idle, async () => {
        await playMusic(voiceChannel, player);
    });
};

module.exports = { init, description, options }
