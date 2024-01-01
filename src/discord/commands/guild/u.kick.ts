import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  ContextMenuCommandBuilder,
  GuildMember,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  ApplicationCommandType,
  TextInputStyle,
} from 'discord-api-types/v10';
import { user_action_type } from '@prisma/client';
import { UserCommand } from '../../@types/commandDef';
// import log from '../../../global/utils/log';
import { moderate } from '../../../global/commands/g.moderate';
import commandContext from '../../utils/context';

const F = f(__filename);

export const uKick: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Kick')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.showModal(new ModalBuilder()
      .setCustomId(`kickModal~${interaction.id}`)
      .setTitle('Tripbot Kick')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('Why are you kicking this person?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Tell the team why you are kicking this user.')
          .setMaxLength(1000)
          .setRequired(true)
          .setCustomId('internalNote')),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('What should we tell the user?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('This will be sent to the user!')
          .setMaxLength(1000)
          .setRequired(false)
          .setCustomId('description')),
      ));
    const filter = (i:ModalSubmitInteraction) => i.customId.includes('kickModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });
        await i.editReply(await moderate(
          interaction.member as GuildMember,
          'KICK' as user_action_type,
          (interaction.targetMember as GuildMember).id,
          i.fields.getTextInputValue('internalNote'),
          i.fields.getTextInputValue('description'),
          null,
        ));
      });
    return true;
  },
};

export default uKick;
