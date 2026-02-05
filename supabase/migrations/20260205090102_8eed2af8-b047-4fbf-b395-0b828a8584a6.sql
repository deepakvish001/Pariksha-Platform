-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (via trigger)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;

-- Create function to notify on new follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    follower_name TEXT;
BEGIN
    -- Get follower's name
    SELECT full_name INTO follower_name
    FROM public.profiles
    WHERE user_id = NEW.follower_id;

    -- Insert notification for the followed user
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
        NEW.following_id,
        'new_follower',
        'New Follower',
        COALESCE(follower_name, 'Someone') || ' started following you',
        jsonb_build_object('follower_id', NEW.follower_id, 'follower_name', follower_name)
    );

    RETURN NEW;
END;
$$;

-- Create trigger for new follows
CREATE TRIGGER on_new_follow
AFTER INSERT ON public.user_follows
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_follow();

-- Create function to notify on rare achievement
CREATE OR REPLACE FUNCTION public.notify_on_rare_achievement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    earner_name TEXT;
    earner_id UUID;
    follower_record RECORD;
    total_users INTEGER;
    earned_count INTEGER;
    percentage NUMERIC;
BEGIN
    earner_id := NEW.user_id;
    
    -- Get earner's name
    SELECT full_name INTO earner_name
    FROM public.profiles
    WHERE user_id = earner_id;

    -- Calculate rarity (simplified - count users with any achievements)
    SELECT COUNT(DISTINCT user_id) INTO total_users FROM public.user_achievements;
    SELECT COUNT(*) INTO earned_count FROM public.user_achievements WHERE achievement_id = NEW.achievement_id;
    
    IF total_users > 0 THEN
        percentage := (earned_count::NUMERIC / total_users::NUMERIC) * 100;
    ELSE
        percentage := 100;
    END IF;

    -- Only notify for epic (< 10%) or legendary (< 3%) achievements
    IF percentage < 10 THEN
        -- Notify all followers of this user
        FOR follower_record IN 
            SELECT follower_id FROM public.user_follows WHERE following_id = earner_id
        LOOP
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (
                follower_record.follower_id,
                'rare_achievement',
                'Rare Achievement Unlocked!',
                COALESCE(earner_name, 'Someone you follow') || ' earned a rare badge: ' || NEW.achievement_id,
                jsonb_build_object(
                    'earner_id', earner_id, 
                    'earner_name', earner_name,
                    'achievement_id', NEW.achievement_id,
                    'rarity_percentage', percentage
                )
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for rare achievements
CREATE TRIGGER on_rare_achievement
AFTER INSERT ON public.user_achievements
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_rare_achievement();