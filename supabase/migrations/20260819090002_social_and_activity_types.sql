-- ============================================================
-- Add TELEGRAM to social_platform enum and add missing
-- activity event types for comprehensive click tracking.
-- ============================================================

alter type public.social_platform add value if not exists 'TELEGRAM';

alter type public.activity_event_type add value if not exists 'TELEGRAM_CLICK';
alter type public.activity_event_type add value if not exists 'YOUTUBE_CLICK';
