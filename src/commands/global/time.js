'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo } = require('../../utils/get-user-info');
const timezones = require('../../assets/timezones.json');

const PREFIX = path.parse(__filename).name;

const { usersDbName } = process.env;
const { db } = global;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('time')
    .setDescription('Get the time of another user!')
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription('Set your own timezone')
      .addStringOption(option => option
        .setName('timezone')
        .setDescription('Timezone value')
        .setRequired(true)
        .setAutocomplete(true)))
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription('Get someone\'s time!')
      .addUserOption(option => option
        .setName('user')
        .setDescription('User to lookup!'))),

  async execute(interaction) {
    const timezone = interaction.options.getString('timezone');
    const target = interaction.options.getMember('user') || interaction.member;
    const actor = interaction.user;

    let command;
    try {
      command = interaction.options.getSubcommand();
    } catch (err) {
      command = 'get';
    }

    if (command === 'set') {
      logger.debug(`${PREFIX} time:`, timezone);
      // define offset as the value from the timezones array
      let tzCode = '';
      for (let i = 0; i < timezones.length; i += 1) {
        if (timezones[i].label === timezone) {
          tzCode = timezones[i].tzCode;
          logger.debug(`${PREFIX} tzCode: ${tzCode}`);
        }
      }
      // logger.debug(`[${PREFIX}] actor.id: ${actor.id}`);

      const [actorData, actorFbid] = getUserInfo(actor);

      if ('timezone' in actorData && actorData.timezone === tzCode) {
        const embed = template
          .embedTemplate()
          .setDescription(`${timezone} already is your timezone, you don't need to update it!`);
        interaction.reply({ embeds: [embed], ephemeral: true });
        logger.debug(`[${PREFIX}] Done!!`);
        return;
      }

      actorData.timezone = tzCode;

      if (actorFbid !== '') {
        logger.debug(`[${PREFIX}] Updating actor data`);
        await db.collection(usersDbName)
          .doc(actorFbid)
          .set(actorData)
          .catch(ex => {
            logger.error(`[${PREFIX}] Error updating actor data:`, ex);
            return Promise.reject(ex);
          });
      } else {
        logger.debug(`[${PREFIX}] Creating actor data`);
        await db.collection(usersDbName)
          .doc()
          .set(actorData)
          .catch(ex => {
            logger.error(`[${PREFIX}] Error creating actor data:`, ex);
            return Promise.reject(ex);
          });
      }
      const embed = template.embedTemplate().setDescription(`I set your timezone to ${timezone}`);
      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
      logger.debug(`[${PREFIX}] Done!!`);
      return;
    }
    if (command === 'get') {
      let tzCode = '';
      const [targetData] = getUserInfo(target);
      if ('timezone' in targetData) tzCode = targetData.timezone;
      if (!tzCode) {
        const embed = template
          .embedTemplate()
          .setDescription(`${target.user.username} is a timeless treasure <3 (and has not set a time zone)`);
        interaction.reply({
          embeds: [embed],
          ephemeral: false,
        });
        logger.debug(`[${PREFIX}] Done!!`);
        return;
      }

      // get the user's timezone from the database
      const timestring = new Date().toLocaleTimeString('en-US', { timeZone: tzCode });
      const embed = template
        .embedTemplate()
        .setDescription(`It is likely ${timestring} wherever ${target.user.username} is located.`);
      if (!interaction.replied) {
        interaction.reply({
          embeds: [embed],
          ephemeral: false,
        });
      } else {
        interaction.followUp({
          embeds: [embed],
          ephemeral: false,
        });
      }
      logger.debug(`[${PREFIX}] finished!`);
    }
  },
};