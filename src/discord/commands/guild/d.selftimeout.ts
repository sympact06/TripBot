import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { parseDuration } from '../../../global/utils/parseDuration';
import { startLog } from '../../utils/startLog'; // eslint-disable-line

const F = f(__filename);

export default selftimeout;

export const selftimeout: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('selftimeout')
    .setDescription('Timeout yourself!')
    .addStringOption(option => option
      .setName('duration')
      .setDescription('How long? Max is 2 weeks!')
      .setRequired(true))
    .addStringOption(option => option
      .setName('confirmation')
      .setDescription('Are you sure? You cannot undo this!')
      .addChoices(
        { name: 'Yes, I won\'t ask a mod to undo.', value: 'yes' },
        { name: 'No, I\'m just testing.', value: 'no' },
      )
      .setRequired(true)),
  async execute(interaction:ChatInputCommandInteraction) {
    startLog(F, interaction);
    if (!interaction.guild) return false;

    const confirmation = interaction.options.getString('confirmation');

    if (confirmation === 'no') {
      interaction.reply({
        content: 'This works exactly like you think it does, try again when you\'re sure!',
        ephemeral: true,
      });
      return false;
    }

    const target = interaction.member as GuildMember;
    const duration = interaction.options.getString('duration');

    const durationValue = await parseDuration(`${duration}`);

    target.timeout(durationValue, 'Self timeout');

    interaction.reply({ content: `We'll see you in ${duration}!`, ephemeral: true });

    const tripsitGuild = await interaction.client.guilds.fetch(env.DISCORD_GUILD_ID);
    const modLog = await tripsitGuild.channels.fetch(env.CHANNEL_MODLOG) as TextChannel;
    modLog.send(`**${target.user.tag}** self timed out for **${duration}**!`);

    return true;
  },
};