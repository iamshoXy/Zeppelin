import { APIEmbed, Message, Snowflake } from "discord.js";
import { GuildPluginData } from "knub";
import { StarboardPluginType, TStarboardOpts } from "../types.js";
import { createStarboardEmbedFromMessage } from "./createStarboardEmbedFromMessage.js";
import { createStarboardPseudoFooterForMessage } from "./createStarboardPseudoFooterForMessage.js";

export async function saveMessageToStarboard(
  pluginData: GuildPluginData<StarboardPluginType>,
  msg: Message,
  starboard: TStarboardOpts,
) {
  const channel = pluginData.guild.channels.cache.get(starboard.channel_id as Snowflake);
  if (!channel?.isTextBased()) return;

  const starCount = (await pluginData.state.starboardReactions.getAllReactionsForMessageId(msg.id)).length;
  const embed = createStarboardEmbedFromMessage(msg, Boolean(starboard.copy_full_embed), starboard.color);
  embed.fields!.push(createStarboardPseudoFooterForMessage(starboard, msg, starboard.star_emoji![0], starCount));

  const starboardMessage = await channel.send({ embeds: [embed as APIEmbed] });
  await pluginData.state.starboardMessages.createStarboardMessage(channel.id, msg.id, starboardMessage.id);
}
