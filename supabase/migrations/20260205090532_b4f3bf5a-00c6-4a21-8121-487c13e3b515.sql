-- Enable pg_net extension for HTTP calls from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to send notification email via edge function
CREATE OR REPLACE FUNCTION public.send_notification_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    supabase_url TEXT;
    service_role_key TEXT;
    payload JSONB;
BEGIN
    -- Get Supabase URL from environment (set via vault or config)
    supabase_url := current_setting('app.settings.supabase_url', true);
    service_role_key := current_setting('app.settings.service_role_key', true);
    
    -- If settings not available, try to use a hardcoded URL pattern
    IF supabase_url IS NULL OR supabase_url = '' THEN
        supabase_url := 'https://lvnpvfxlmzbnylwkvgnq.supabase.co';
    END IF;
    
    -- Build payload
    payload := jsonb_build_object(
        'notification_id', NEW.id,
        'user_id', NEW.user_id,
        'type', NEW.type,
        'title', NEW.title,
        'message', NEW.message,
        'data', NEW.data
    );
    
    -- Make async HTTP request to edge function
    PERFORM extensions.http_post(
        url := supabase_url || '/functions/v1/send-notification-email',
        body := payload::text,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(service_role_key, current_setting('request.jwt', true))
        )::jsonb
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the notification insert
        RAISE WARNING 'Failed to send notification email: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Create trigger to send email on notification insert
DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;
CREATE TRIGGER on_notification_created
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.send_notification_email();