REVOKE EXECUTE ON FUNCTION
  public.admin_list_users(text,int,int),
  public.admin_grant_role(uuid, app_role),
  public.admin_revoke_role(uuid, app_role),
  public.admin_suspend_user(uuid, text),
  public.admin_unsuspend_user(uuid),
  public.admin_set_setting(text, jsonb),
  public.admin_broadcast_notification(jsonb, text, text, jsonb),
  public.admin_schedule_daily_challenge(date, text),
  public.admin_dashboard_kpis(),
  public.admin_trend_submissions(int),
  public.admin_trend_signups(int),
  public.admin_resolve_report(uuid, text),
  public.admin_set_ai_content_visibility(uuid, boolean),
  public.admin_delete_ai_content(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  public.admin_list_users(text,int,int),
  public.admin_grant_role(uuid, app_role),
  public.admin_revoke_role(uuid, app_role),
  public.admin_suspend_user(uuid, text),
  public.admin_unsuspend_user(uuid),
  public.admin_set_setting(text, jsonb),
  public.admin_broadcast_notification(jsonb, text, text, jsonb),
  public.admin_schedule_daily_challenge(date, text),
  public.admin_dashboard_kpis(),
  public.admin_trend_submissions(int),
  public.admin_trend_signups(int),
  public.admin_resolve_report(uuid, text),
  public.admin_set_ai_content_visibility(uuid, boolean),
  public.admin_delete_ai_content(uuid)
TO authenticated;