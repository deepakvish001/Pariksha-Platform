-- Update notify_on_follow to check user preferences
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    follower_name TEXT;
    user_prefs RECORD;
BEGIN
    -- Check if the followed user has new_follower notifications enabled
    SELECT notify_new_follower INTO user_prefs
    FROM public.user_profiles_extended
    WHERE user_id = NEW.following_id;

    -- Skip notification if user has disabled it
    IF user_prefs.notify_new_follower = false THEN
        RETURN NEW;
    END IF;

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

-- Update notify_on_rare_achievement to check user preferences
CREATE OR REPLACE FUNCTION public.notify_on_rare_achievement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    earner_name TEXT;
    earner_id UUID;
    follower_record RECORD;
    total_users INTEGER;
    earned_count INTEGER;
    percentage NUMERIC;
    follower_prefs RECORD;
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
        -- Notify all followers of this user who have rare achievement notifications enabled
        FOR follower_record IN 
            SELECT uf.follower_id 
            FROM public.user_follows uf
            WHERE uf.following_id = earner_id
        LOOP
            -- Check follower's notification preferences
            SELECT notify_rare_achievement INTO follower_prefs
            FROM public.user_profiles_extended
            WHERE user_id = follower_record.follower_id;

            -- Skip if follower has disabled rare achievement notifications
            IF follower_prefs.notify_rare_achievement = false THEN
                CONTINUE;
            END IF;

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