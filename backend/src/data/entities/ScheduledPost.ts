import { Attachment } from "discord.js";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { StrictMessageContent } from "../../utils.js";

@Entity("scheduled_posts")
export class ScheduledPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column() guild_id: string;

  @Column() author_id: string;

  @Column() author_name: string;

  @Column() channel_id: string;

  @Column("simple-json") content: StrictMessageContent;

  @Column("simple-json") attachments: Attachment[];

  @Column({ type: String, nullable: true }) post_at: string | null;

  /**
   * How often to post the message, in milliseconds
   */
  @Column({ type: String, nullable: true }) repeat_interval: number | null;

  @Column({ type: String, nullable: true }) repeat_until: string | null;

  @Column({ type: String, nullable: true }) repeat_times: number | null;

  @Column() enable_mentions: boolean;
}
