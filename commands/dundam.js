const axios = require('axios');
const DiscordJS = require('discord.js');
const { MessageEmbed } = require('discord.js');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
});
const STRING = DiscordJS.Constants.ApplicationCommandOptionTypes.STRING;

const apiKey = process.env.NEOPLE_API_KEY;
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
  const serverList = [{
    "serverId": "cain",
    "serverName": "카인"
  }, {
    "serverId": "diregie",
    "serverName": "디레지에"
  }, {
    "serverId": "siroco",
    "serverName": "시로코"
  }, {
    "serverId": "prey",
    "serverName": "프레이"
  }, {
    "serverId": "casillas",
    "serverName": "카시야스"
  }, {
    "serverId": "hilder",
    "serverName": "힐더"
  }, {
    "serverId": "anton",
    "serverName": "안톤"
  }, {
    "serverId": "bakal",
    "serverName": "바칼"
  }
  ];

  const serverInfo = serverList.find(x => x.serverName === server);

  return serverInfo?.serverId;
}

const getIsBuffer = (character) => {
  const bufferJobNameList = ["인챈트리스", "블랙 메이든", "헤카테", "眞 인챈트리스", "크루세이더", "홀리오더", "세인트", "眞 크루세이더", "에반젤리스트", "세라핌"];
  return bufferJobNameList.includes(character.job) && character.switchingName !== '성령의 메이스';
};

const getUserInfo = async (server, nickname) => {
  try {
    const url = `https://api.neople.co.kr/df/servers/${getServerNameToCode(server)}/characters?characterName=${nickname}&apikey=${apiKey}`;
    const { data } = await axios.get(url);

    return data?.rows;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const getDundamInfo = async (server, nickname, characterId) => {
  try {
    const url = `https://dundam.xyz/dat/viewData.jsp?image=${characterId}&server=${getServerNameToCode(server)}&name=${encodeURIComponent(nickname)}&reloading=&serverT=`;
    const { data } = await axios.post(url);

    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
}

const numberToKorean = (number) => {
  const inputNumber = number < 0 ? false : number;
  const unitWords = ['', '만', '억', '조', '경'];
  const splitUnit = 10000;
  const splitCount = unitWords.length;
  const resultArray = [];
  let resultString = '';

  for (let i = 0; i < splitCount; i++) {
    let unitResult = (inputNumber % Math.pow(splitUnit, i + 1)) / Math.pow(splitUnit, i);
    unitResult = Math.floor(unitResult);
    if (unitResult > 0) {
      resultArray[i] = unitResult;
    }
  }

  for (let i = 0; i < resultArray.length; i++) {
    if (!resultArray[i]) continue;
    resultString = String(resultArray[i]) + unitWords[i] + ' ' + resultString;
  }

  return resultString;
}

const init = async (interaction, client) => {
  const server = interaction.options.getString('server');
  const nickname = interaction.options.getString('nickname');

  try {
    // 캐릭 정보 가져오기
    const users = await getUserInfo(server, nickname);
    if (users?.length === 0) {
      interaction.reply(`캐릭터가 존재하지 않아요!`);
      return;
    }
    const characterId = users[0].characterId;

    // 던담 정보 가져오기
    const character = await getDundamInfo(server, nickname, characterId);
    if (!character) {
      interaction.reply('던담에서 데이터를 가져오는 중에 오류가 발생했어요!');
    }
    const characterImageUrl = `https://img-api.neople.co.kr/df/servers/${getServerNameToCode(server)}/characters/${characterId}?zoom=1`;
    const fields = [];

    if (getIsBuffer(character)) {
      let buffPowerObj = character.buffCal.find(x => x.buffScore);
      const buffPower = buffPowerObj['4PBuffScore'] ?? buffPowerObj.buffScore;

      fields.push({ name: '버프력', value: buffPower });
      fields.push({ name: '랭킹', value: `${character.bufferRanking} / ${character.bufferRankingAll} (상위 ${(character.bufferRanking / character.bufferRankingAll * 100).toFixed(2)}%)` });
    } else {
      let damage = character.damageList.vsRanking.find(x => x.name === '총 합').dam;
      damage = Number(damage.replaceAll(',', ''));

      fields.push({ name: '대미지', value: numberToKorean(damage) });
      fields.push({ name: '랭킹', value: `${character.dealerRanking} / ${character.dealerRankingAll} (상위 ${(character.dealerRanking / character.dealerRankingAll * 100).toFixed(2)}%)` });
    }
    fields.push({ name: '명성', value: character.fame ?? '0', inline: true });
    fields.push({ name: '모험단', value: character.adventure ?? '-', inline: true });
    fields.push({ name: '길드', value: character.gulid ?? '-', inline: true });

    const embed = new MessageEmbed()
      .setColor(0xF701FB)
      .setTitle(character.name)
      .setImage(characterImageUrl)
      .setDescription(character.job)
      .addFields(...fields);

    // 완료 메시지
    interaction.reply({ embeds: [embed] });
  } catch (e) {
    console.error(e);
    interaction.reply('내부 오류가 발생했어요!');
  }
};

module.exports = { init, description, options }
