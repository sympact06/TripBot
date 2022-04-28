const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const axios = require('axios');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const UD_TOKEN = process.env.rapid_api_key;
const ts_icon_url = process.env.ts_icon_url;
const ts_flame_url = process.env.ts_flame_url;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('urban_define')
        .setDescription('Define a word on Urban Dictionary')
        .addStringOption(option => option.setName('define').setDescription('What do you want to define?').setRequired(true)),
    async execute(interaction) {
        const word = interaction.options.getString('define');

        const options = {
            method: 'GET',
            url: 'https://mashape-community-urban-dictionary.p.rapidapi.com/define',
            params: { term: word },
            headers: {
                'X-RapidAPI-Host': 'mashape-community-urban-dictionary.p.rapidapi.com',
                'X-RapidAPI-Key': UD_TOKEN,
                useQueryString: true,
            },
        };
        axios.request(options).then(function(response) {
            const data = response.data;
            // Sort data by the thumbs_up value
            data.list.sort((a, b) => b.thumbs_up - a.thumbs_up);
            logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 2)}`);
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                .setColor('RANDOM')
                .setTitle(`Definition for: ${word}`)
                .addFields(
                    { name: `Definition A (+${data.list[0].thumbs_up}/-${data.list[0].thumbs_down})`, value: `${data.list[0].definition.length > 1024 ? `${data.list[0].definition.slice(0, 1020)}...` : data.list[0].definition}`, inline: false },
                    { name: 'Example A', value: data.list[0].example, inline: false },
                    { name: `Definition B (+${data.list[1].thumbs_up}/-${data.list[1].thumbs_down})`, value: `${data.list[1].definition.length > 1024 ? `${data.list[1].definition.slice(0, 1020)}...` : data.list[1].definition}`, inline: false },
                    { name: 'Example B', value: data.list[1].example, inline: false },
                    { name: `Definition C (+${data.list[2].thumbs_up}/-${data.list[2].thumbs_down})`, value: `${data.list[2].definition.length > 1024 ? `${data.list[2].definition.slice(0, 1020)}...` : data.list[2].definition}`, inline: false },
                    { name: 'Example C', value: data.list[2].example, inline: false },
                )
                .setFooter({ text: 'Dose responsibly!', iconURL: ts_flame_url });
            interaction.reply({ embeds: [embed], ephemeral: false });
            logger.debug(`[${PREFIX}] finished!`);
            return;
        }).catch(function(error) {
            console.error(error);
        });
    },
};

