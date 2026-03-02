-- Migration: Show all season teams in standings (even with 0 matches)
-- Date: 2026-03-02
-- Description: Changed both standings functions to include teams from
--              season_teams (for new seasons) AND from completed matches
--              (for legacy seasons without season_teams rows).
--              Teams with no completed matches now appear with all stats at 0,
--              sorted alphabetically.

-- =============================================================================
-- Function: get_ncl_standings
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_ncl_standings(
    p_competition_id uuid,
    p_season_id uuid,
    p_stage_filter text DEFAULT 'regular_season'::text
)
RETURNS TABLE(
    team_id uuid,
    team_name text,
    team_logo_url text,
    matches_played bigint,
    wins bigint,
    draws bigint,
    losses bigint,
    goals_for bigint,
    goals_against bigint,
    goal_difference bigint,
    points bigint,
    fair_play_points bigint
)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH completed_matches AS (
        SELECT
            m.id,
            m.home_team_id,
            m.away_team_id,
            m.home_score,
            m.away_score
        FROM public.matches m
        WHERE
            m.competition_id = p_competition_id
            AND m.season_id = p_season_id
            AND m.status = 'completed'
            AND m.home_score IS NOT NULL
            AND m.away_score IS NOT NULL
            AND (p_stage_filter IS NULL OR m.stage = p_stage_filter)
    ),
    team_stats AS (
        SELECT
            cm.home_team_id AS stat_team_id,
            1 AS matches_played,
            CASE WHEN cm.home_score > cm.away_score THEN 3 WHEN cm.home_score = cm.away_score THEN 1 ELSE 0 END AS pts,
            cm.home_score AS goals_for,
            cm.away_score AS goals_against
        FROM completed_matches cm
        UNION ALL
        SELECT
            cm.away_team_id AS stat_team_id,
            1 AS matches_played,
            CASE WHEN cm.away_score > cm.home_score THEN 3 WHEN cm.away_score = cm.home_score THEN 1 ELSE 0 END AS pts,
            cm.away_score AS goals_for,
            cm.home_score AS goals_against
        FROM completed_matches cm
    ),
    aggregated_stats AS (
        SELECT
            ts.stat_team_id,
            SUM(ts.matches_played) AS matches_played,
            SUM(CASE WHEN ts.pts = 3 THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN ts.pts = 1 THEN 1 ELSE 0 END) AS draws,
            SUM(CASE WHEN ts.pts = 0 THEN 1 ELSE 0 END) AS losses,
            SUM(ts.goals_for) AS goals_for,
            SUM(ts.goals_against) AS goals_against,
            SUM(ts.goals_for) - SUM(ts.goals_against) AS goal_difference,
            SUM(ts.pts) AS pts
        FROM team_stats ts
        GROUP BY ts.stat_team_id
    ),
    tied_groups AS (
        SELECT
            ags.pts AS tied_pts,
            array_agg(ags.stat_team_id) as teams
        FROM aggregated_stats ags
        GROUP BY ags.pts
        HAVING count(*) > 1
    ),
    head_to_head_stats AS (
        SELECT
            hth.stat_team_id,
            SUM(hth.pts) as h2h_points,
            SUM(hth.goals_for) - SUM(hth.goals_against) as h2h_goal_difference,
            SUM(hth.goals_for) as h2h_goals_for
        FROM (
            SELECT
                cm.home_team_id as stat_team_id,
                CASE WHEN cm.home_score > cm.away_score THEN 3 WHEN cm.home_score = cm.away_score THEN 1 ELSE 0 END as pts,
                cm.home_score as goals_for,
                cm.away_score as goals_against
            FROM completed_matches cm
            JOIN tied_groups tg ON cm.home_team_id = ANY(tg.teams) AND cm.away_team_id = ANY(tg.teams)
            UNION ALL
            SELECT
                cm.away_team_id as stat_team_id,
                CASE WHEN cm.away_score > cm.home_score THEN 3 WHEN cm.away_score = cm.home_score THEN 1 ELSE 0 END as pts,
                cm.away_score as goals_for,
                cm.home_score as goals_against
            FROM completed_matches cm
            JOIN tied_groups tg ON cm.home_team_id = ANY(tg.teams) AND cm.away_team_id = ANY(tg.teams)
        ) hth
        GROUP BY hth.stat_team_id
    ),
    fair_play_stats AS (
        SELECT
            fpe.team_id AS fp_team_id,
            SUM(
                CASE fpe.event_type::text
                    WHEN 'yellow_card' THEN -1
                    WHEN 'red_card' THEN -3
                    ELSE 0
                END
            ) as fair_play_points
        FROM public.fair_play_events fpe
        JOIN public.matches m ON fpe.match_id = m.id
        WHERE m.competition_id = p_competition_id
          AND m.season_id = p_season_id
          AND m.status = 'completed'
          AND (p_stage_filter IS NULL OR m.stage = p_stage_filter)
        GROUP BY fpe.team_id
    ),
    all_season_teams AS (
        SELECT st.team_id AS tid FROM public.season_teams st WHERE st.season_id = p_season_id
        UNION
        SELECT home_team_id AS tid FROM completed_matches
        UNION
        SELECT away_team_id AS tid FROM completed_matches
    )
    SELECT
        t.id AS team_id,
        t.name AS team_name,
        t.logo_url AS team_logo_url,
        COALESCE(ags.matches_played, 0) AS matches_played,
        COALESCE(ags.wins, 0) AS wins,
        COALESCE(ags.draws, 0) AS draws,
        COALESCE(ags.losses, 0) AS losses,
        COALESCE(ags.goals_for, 0) AS goals_for,
        COALESCE(ags.goals_against, 0) AS goals_against,
        COALESCE(ags.goal_difference, 0) AS goal_difference,
        COALESCE(ags.pts, 0) AS points,
        COALESCE(fps.fair_play_points, 0) AS fair_play_points
    FROM public.teams t
    LEFT JOIN aggregated_stats ags ON t.id = ags.stat_team_id
    LEFT JOIN head_to_head_stats hhs ON t.id = hhs.stat_team_id
    LEFT JOIN fair_play_stats fps ON t.id = fps.fp_team_id
    WHERE t.id IN (SELECT tid FROM all_season_teams)
    ORDER BY
        COALESCE(ags.pts, 0) DESC,
        COALESCE(hhs.h2h_points, -1) DESC,
        COALESCE(hhs.h2h_goal_difference, -999) DESC,
        COALESCE(hhs.h2h_goals_for, -1) DESC,
        COALESCE(ags.goal_difference, 0) DESC,
        COALESCE(ags.goals_for, 0) DESC,
        COALESCE(fps.fair_play_points, 0) DESC,
        t.name ASC;
END;
$function$;

-- =============================================================================
-- Function: get_league_table
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_league_table(
    p_competition_id uuid,
    p_season_id uuid
)
RETURNS SETOF league_table_row
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH completed_matches AS (
        SELECT
            m.id,
            m.home_team_id,
            m.away_team_id,
            m.home_score,
            m.away_score
        FROM public.matches m
        WHERE
            m.competition_id = p_competition_id
            AND m.season_id = p_season_id
            AND m.status = 'completed'
            AND m.home_score IS NOT NULL
            AND m.away_score IS NOT NULL
    ),
    team_stats AS (
        SELECT
            cm.home_team_id AS stat_team_id,
            1 AS matches_played,
            CASE WHEN cm.home_score > cm.away_score THEN 3 WHEN cm.home_score = cm.away_score THEN 1 ELSE 0 END AS pts,
            cm.home_score AS goals_for,
            cm.away_score AS goals_against
        FROM completed_matches cm
        UNION ALL
        SELECT
            cm.away_team_id AS stat_team_id,
            1 AS matches_played,
            CASE WHEN cm.away_score > cm.home_score THEN 3 WHEN cm.away_score = cm.home_score THEN 1 ELSE 0 END AS pts,
            cm.away_score AS goals_for,
            cm.home_score AS goals_against
        FROM completed_matches cm
    ),
    aggregated_stats AS (
        SELECT
            ts.stat_team_id,
            SUM(ts.matches_played) AS matches_played,
            SUM(CASE WHEN ts.pts = 3 THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN ts.pts = 1 THEN 1 ELSE 0 END) AS draws,
            SUM(CASE WHEN ts.pts = 0 THEN 1 ELSE 0 END) AS losses,
            SUM(ts.goals_for) AS goals_for,
            SUM(ts.goals_against) AS goals_against,
            SUM(ts.goals_for) - SUM(ts.goals_against) AS goal_difference,
            SUM(ts.pts) AS pts
        FROM team_stats ts
        GROUP BY ts.stat_team_id
    ),
    tied_groups AS (
        SELECT
            ags.pts AS tied_pts,
            array_agg(ags.stat_team_id) as teams
        FROM aggregated_stats ags
        GROUP BY ags.pts
        HAVING count(*) > 1
    ),
    head_to_head_stats AS (
        SELECT
            hth.stat_team_id,
            SUM(hth.pts) as h2h_points,
            SUM(hth.goals_for) - SUM(hth.goals_against) as h2h_goal_difference,
            SUM(hth.goals_for) as h2h_goals_for
        FROM (
            SELECT
                cm.home_team_id as stat_team_id,
                CASE WHEN cm.home_score > cm.away_score THEN 3 WHEN cm.home_score = cm.away_score THEN 1 ELSE 0 END as pts,
                cm.home_score as goals_for,
                cm.away_score as goals_against
            FROM completed_matches cm
            JOIN tied_groups tg ON cm.home_team_id = ANY(tg.teams) AND cm.away_team_id = ANY(tg.teams)
            UNION ALL
            SELECT
                cm.away_team_id as stat_team_id,
                CASE WHEN cm.away_score > cm.home_score THEN 3 WHEN cm.away_score = cm.home_score THEN 1 ELSE 0 END as pts,
                cm.away_score as goals_for,
                cm.home_score as goals_against
            FROM completed_matches cm
            JOIN tied_groups tg ON cm.home_team_id = ANY(tg.teams) AND cm.away_team_id = ANY(tg.teams)
        ) hth
        GROUP BY hth.stat_team_id
    ),
    all_season_teams AS (
        SELECT st.team_id AS tid FROM public.season_teams st WHERE st.season_id = p_season_id
        UNION
        SELECT home_team_id AS tid FROM completed_matches
        UNION
        SELECT away_team_id AS tid FROM completed_matches
    )
    SELECT
        t.id AS team_id,
        t.name AS team_name,
        t.logo_url AS team_logo_url,
        COALESCE(ags.matches_played, 0) as matches_played,
        COALESCE(ags.wins, 0) as wins,
        COALESCE(ags.draws, 0) as draws,
        COALESCE(ags.losses, 0) as losses,
        COALESCE(ags.goals_for, 0) as goals_for,
        COALESCE(ags.goals_against, 0) as goals_against,
        COALESCE(ags.goal_difference, 0) as goal_difference,
        COALESCE(ags.pts, 0) as points
    FROM public.teams t
    LEFT JOIN aggregated_stats ags ON t.id = ags.stat_team_id
    LEFT JOIN head_to_head_stats hhs ON t.id = hhs.stat_team_id
    WHERE t.id IN (SELECT tid FROM all_season_teams)
    ORDER BY
        COALESCE(ags.pts, 0) DESC,
        COALESCE(hhs.h2h_points, -1) DESC,
        COALESCE(hhs.h2h_goal_difference, -999) DESC,
        COALESCE(hhs.h2h_goals_for, -1) DESC,
        COALESCE(ags.goal_difference, 0) DESC,
        COALESCE(ags.goals_for, 0) DESC,
        t.name ASC;
END;
$function$;
