import { AuditLogEvent, User } from "discord.js";
import { CaseTypes } from "../../../data/CaseTypes.js";
import { Case } from "../../../data/entities/Case.js";
import { UnknownUser, resolveUser } from "../../../utils.js";
import { findMatchingAuditLogEntry } from "../../../utils/findMatchingAuditLogEntry.js";
import { CasesPlugin } from "../../Cases/CasesPlugin.js";
import { LogsPlugin } from "../../Logs/LogsPlugin.js";
import { clearIgnoredEvents } from "../functions/clearIgnoredEvents.js";
import { isEventIgnored } from "../functions/isEventIgnored.js";
import { IgnoredEventType, modActionsEvt } from "../types.js";

/**
 * Create an UNBAN case automatically when a user is unbanned manually.
 * Attempts to find the unban's details in the audit log.
 */
export const CreateUnbanCaseOnManualUnbanEvt = modActionsEvt({
  event: "guildBanRemove",
  async listener({ pluginData, args: { ban } }) {
    const user = ban.user;
    if (isEventIgnored(pluginData, IgnoredEventType.Unban, user.id)) {
      clearIgnoredEvents(pluginData, IgnoredEventType.Unban, user.id);
      return;
    }

    const relevantAuditLogEntry = await findMatchingAuditLogEntry(
      pluginData.guild,
      AuditLogEvent.MemberBanRemove,
      user.id,
    );

    const casesPlugin = pluginData.getPlugin(CasesPlugin);

    let createdCase: Case | null = null;
    let mod: User | UnknownUser | null = null;

    if (relevantAuditLogEntry) {
      const modId = relevantAuditLogEntry.executor!.id;
      const auditLogId = relevantAuditLogEntry.id;

      mod = await resolveUser(pluginData.client, modId);

      const config = mod instanceof UnknownUser ? pluginData.config.get() : await pluginData.config.getForUser(mod);

      if (config.create_cases_for_manual_actions) {
        createdCase = await casesPlugin.createCase({
          userId: user.id,
          modId,
          type: CaseTypes.Unban,
          auditLogId,
          automatic: true,
        });
      }
    } else {
      const config = pluginData.config.get();
      if (config.create_cases_for_manual_actions) {
        createdCase = await casesPlugin.createCase({
          userId: user.id,
          modId: "0",
          type: CaseTypes.Unban,
          automatic: true,
        });
      }
    }

    pluginData.getPlugin(LogsPlugin).logMemberUnban({
      mod,
      userId: user.id,
      caseNumber: createdCase?.case_number ?? 0,
      reason: "",
    });

    pluginData.state.events.emit("unban", user.id);
  },
});
