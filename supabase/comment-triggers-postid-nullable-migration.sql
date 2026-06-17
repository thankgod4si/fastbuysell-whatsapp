-- Allow comment_triggers.post_id to be nullable so triggers can apply to whole page
ALTER TABLE comment_triggers ALTER COLUMN post_id DROP NOT NULL;
