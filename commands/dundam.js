const axios = require('axios');
const DiscordJS = require('discord.js');
const STRING = DiscordJS.Constants.ApplicationCommandOptionTypes.STRING;

const description = '던담에서 내 캐릭터 정보를 가져옵니다.';

const options = [
    {
        name: 'server',
        description: '서버',
        required: true,
        type: STRING,
    },
    {
        name: 'nickname',
        description: '닉네임',
        required: true,
        type: STRING,
    }
];

const getServerNameToCode = (server) => {
    server = server.trim();
    const serverList = [ {
        "serverId" : "cain",
        "serverName" : "카인"
      }, {
        "serverId" : "diregie",
        "serverName" : "디레지에"
      }, {
        "serverId" : "siroco",
        "serverName" : "시로코"
      }, {
        "serverId" : "prey",
        "serverName" : "프레이"
      }, {
        "serverId" : "casillas",
        "serverName" : "카시야스"
      }, {
        "serverId" : "hilder",
        "serverName" : "힐더"
      }, {
        "serverId" : "anton",
        "serverName" : "안톤"
      }, {
        "serverId" : "bakal",
        "serverName" : "바칼"
      } 
    ];

    const serverInfo = serverList.find(x => x.serverName === server);

    return serverInfo?.serverId;
}

const getUserInfo = async (server, nickname) => {
    const url = `https://api.neople.co.kr/df/servers/${getServerNameToCode(server)}/characters?characterName=${nickname}&apikey=${apiKey}`;
    const { data } = await axios.get(url);

    return data;
};

const getDundamInfo = async (server, nickname, characterId) => {
    const url = `https://dundam.xyz/dat/viewData.jsp?image=${characterId}&server=${getServerNameToCode(server)}&name=${encodeURIComponent(nickname)}&reloading=&serverT=`;
    const { data } = await axios.post(url);

    return data;
}

const init = async (interaction, client) => {
    const server = interaction.options.getString('server');
    const nickname = interaction.options.getString('sernicknamever');
    const { options, guild, member } = interaction;

    // 추가 완료 메시지
    interaction.reply(`추가 완료!`);
};

module.exports = { init, description, options }
