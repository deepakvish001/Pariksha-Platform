
CREATE OR REPLACE VIEW public.b2b_onboarding_funnel
WITH (security_invoker = true)
AS
WITH stages AS (
  SELECT
    COUNT(DISTINCT user_id) FILTER (WHERE event = 'org_created')        AS orgs_created,
    COUNT(DISTINCT user_id) FILTER (WHERE event = 'invite_send')        AS users_sent_invites,
    COUNT(*)                FILTER (WHERE event = 'invite_send')        AS invite_send_events,
    COUNT(*)                FILTER (WHERE event = 'invite_resend')      AS invite_resend_events,
    COUNT(DISTINCT user_id) FILTER (WHERE event = 'copy_invite_link')   AS users_copied_link,
    COUNT(*)                FILTER (WHERE event = 'copy_invite_link')   AS copy_link_events,
    COUNT(DISTINCT user_id) FILTER (WHERE event = 'skip_invites')       AS users_skipped
  FROM public.b2b_onboarding_events
)
SELECT
  orgs_created,
  users_sent_invites,
  invite_send_events,
  invite_resend_events,
  users_copied_link,
  copy_link_events,
  users_skipped,
  ROUND(100.0 * users_sent_invites / NULLIF(orgs_created, 0), 2)  AS pct_orgs_to_invite_send,
  ROUND(100.0 * users_copied_link / NULLIF(users_sent_invites, 0), 2) AS pct_invite_to_copy,
  ROUND(100.0 * users_skipped     / NULLIF(orgs_created, 0), 2)   AS pct_orgs_skipped
FROM stages;

GRANT SELECT ON public.b2b_onboarding_funnel TO authenticated, service_role;
