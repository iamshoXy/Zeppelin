import { commandTypeHelpers as ct } from "../../../commandTypes";
import { CaseTypes } from "../../../data/CaseTypes";
import { sendErrorMessage, sendSuccessMessage } from "../../../pluginUtils";
import { renderUsername, resolveMember, resolveUser } from "../../../utils";
import { CasesPlugin } from "../../Cases/CasesPlugin";
import { LogsPlugin } from "../../Logs/LogsPlugin";
import { formatReasonWithAttachments } from "../functions/formatReasonWithAttachments";
import { modActionsCmd } from "../types";

export const NoteCmd = modActionsCmd({
  trigger: "note",
  permission: "can_note",
  description: "Add a note to the specified user",

  signature: {
    user: ct.string(),
    note: ct.string({ required: false, catchAll: true }),
  },

  async run({ pluginData, message: msg, args }) {
    const user = await resolveUser(pluginData.client, args.user);
    if (!user.id) {
      sendErrorMessage(pluginData, msg.channel, `User not found`);
      return;
    }

    const staffMember = await resolveMember(
      pluginData.client,
      pluginData.guild,
      msg.author.id
    );
    if (!staffMember) return;
    if (
      staffMember.roles.cache.has("1266486986479501322") &&
      user.id !== "1265712821543632987"
    )
      return;

    if (!args.note && msg.attachments.size === 0) {
      sendErrorMessage(pluginData, msg.channel, "Text or attachment required");
      return;
    }

    const userName = renderUsername(user);
    const reason = formatReasonWithAttachments(args.note, [
      ...msg.attachments.values(),
    ]);

    const casesPlugin = pluginData.getPlugin(CasesPlugin);
    const createdCase = await casesPlugin.createCase({
      userId: user.id,
      modId: msg.author.id,
      type: CaseTypes.Note,
      reason,
    });

    pluginData.getPlugin(LogsPlugin).logMemberNote({
      mod: msg.author,
      user,
      caseNumber: createdCase.case_number,
      reason,
    });

    sendSuccessMessage(
      pluginData,
      msg.channel,
      `Note added on **${userName}** (Case #${createdCase.case_number})`
    );

    pluginData.state.events.emit("note", user.id, reason);
  },
});
