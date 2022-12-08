const DiscordJS = require('discord.js');
const ytdl = require('ytdl-core-discord');
const { createAudioPlayer, createAudioResource, getVoiceConnection, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const STRING = DiscordJS.Constants.ApplicationCommandOptionTypes.STRING;
const QueueService = require('./../queue/queue.service');

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
    try {
        const queue = await QueueService.getQueue(id);
        if (queue.length === 0) {
            return [null, null];
        }
    
        const url = queue.shift();
        await QueueService.setQueue(id, queue);
    
        const musicInfo = await ytdl.getBasicInfo(url);
        const music = await ytdl(url, { 
            quality: 'highestaudio', 
            filter: "audioonly", 
            highWaterMark: 1 << 62,
            liveBuffer: 1 << 62,
            dlChunkSize: 0
        });
        const resource = createAudioResource(music);
    
        return [resource, musicInfo];
    } catch (e) {
        if (e.message.contains('No video id found:')) {
            return [null, null];
        }
    }
}

const playMusic = async (voiceChannel, connection, player, interaction) => {
    const subscription = connection.subscribe(player);
    // if (subscription) {
    //     setTimeout(() => subscription.unsubscribe(), 5_000);
    // }

    const [music, musicInfo] = await getMusic(voiceChannel.guildId);
    if (music === null) { 
        return;
    }
    player.play(music);
    interaction.channel.send(`노래를 재생할게요!\n${musicInfo.videoDetails.video_url}`);
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

    let connection = getVoiceConnection(voiceChannel.guildId);
    // let connection = joinVoiceChannel({
    //     channelId: voiceChannel.id,
    //     guildId: voiceChannel.guildId,
    //     adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    // });
    if (!connection) {
        connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
    }

    const queue = await QueueService.getQueue(guild.id);
    queue.push(url);
    await QueueService.setQueue(guild.id, queue);
    // 추가 완료 메시지
    interaction.reply(`추가 완료!`);
    
    const player = createAudioPlayer();

    player.on('error', error => {
        console.error(error);
    });
    
    connection.on('stateChange', async (oldState, newState) => {
	    console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);

        if (oldState.status === 'connecting' && newState.status === 'ready') {
            await playMusic(voiceChannel, connection, player, interaction);
        }
    });

    player.on('stateChange', async (oldState, newState) => {
        console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);

        if (oldState.status === 'playing' && newState.status === 'idle') {
            const queue = await QueueService.getQueue(guild.id);
            if (queue.length === 0) {
                connection.destroy();
                player.stop();
            } else {
                await playMusic(voiceChannel, connection, player, interaction);
            }
        }
    });

};

module.exports = { init, description, options }
