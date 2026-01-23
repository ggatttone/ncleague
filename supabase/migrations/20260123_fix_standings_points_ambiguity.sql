-- Migration: Fix "column reference 'points' is ambiguous" error
-- Date: 2026-01-23
-- Description: Renamed internal 'points' column to 'pts' in CTEs to avoid
--              ambiguity with the function return type column name.

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
            cm.home_team_id AS team_id,
            1 AS matches_played,
            CASE WHEN cm.home_score > cm.away_score THEN 3 WHEN cm.home_score = cm.away_score THEN 1 ELSE 0 END AS pts,
            cm.home_score AS goals_for,
            cm.away_score AS goals_against
        FROM completed_matches cm
        UNION ALL
        SELECT
            cm.away_team_id AS team_id,
            1 AS matches_played,
            CASE WHEN cm.away_score > cm.home_score THEN 3 WHEN cm.away_score = cm.home_score THEN 1 ELSE 0 END AS pts,
            cm.away_score AS goals_for,
            cm.home_score AS goals_against
        FROM completed_matches cm
    ),
    aggregated_stats AS (
        SELECT
            ts.team_id,
            SUM(ts.matches_played) AS matches_played,
            SUM(CASE WHEN ts.pts = 3 THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN ts.pts = 1 THEN 1 ELSE 0 END) AS draws,
            SUM(CASE WHEN ts.pts = 0 THEN 1 ELSE 0 END) AS losses,
            SUM(ts.goals_for) AS goals_for,
            SUM(ts.goals_against) AS goals_against,
            SUM(ts.goals_for) - SUM(ts.goals_against) AS goal_difference,
            SUM(ts.pts) AS pts
        FROM team_stats ts
        GROUP BY ts.team_id
    ),
    tied_groups AS (
        SELECT
            ags.pts AS tied_pts,
            array_agg(ags.team_id) as teams
        FROM aggregated_stats ags
        GROUP BY ags.pts
        HAVING count(*) > 1
    ),
    head_to_head_stats AS (
        SELECT
            hth.team_id,
            SUM(hth.pts) as h2h_points,
            SUM(hth.goals_for) - SUM(hth.goals_against) as h2h_goal_difference,
            SUM(hth.goals_for) as h2h_goals_for
        FROM (
            SELECT
                cm.home_team_id as team_id,
                CASE WHEN cm.home_score > cm.away_score THEN 3 WHEN cm.home_score = cm.away_score THEN 1 ELSE 0 END as pts,
                cm.home_score as goals_for,
                cm.away_score as goals_against
            FROM completed_matches cm
            JOIN tied_groups tg ON cm.home_team_id = ANY(tg.teams) AND cm.away_team_id = ANY(tg.teams)
            UNION ALL
            SELECT
                cm.away_team_id as team_id,
                CASE WHEN cm.away_score > cm.home_score THEN 3 WHEN cm.away_score = cm.home_score THEN 1 ELSE 0 END as pts,
                cm.away_score as goals_for,
                cm.home_score as goals_against
            FROM completed_matches cm
            JOIN tied_groups tg ON cm.home_team_id = ANY(tg.teams) AND cm.away_team_id = ANY(tg.teams)
        ) hth
        GROUP BY hth.team_id
    ),
    fair_play_stats AS (
        SELECT
            fpe.team_id,
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
    )
    SELECT
        t.id AS team_id,
        t.name AS team_name,
        t.logo_url AS team_logo_url,
        ags.matches_played,
        ags.wins,
        ags.draws,
        ags.losses,
        ags.goals_for,
        ags.goals_against,
        ags.goal_difference,
        ags.pts AS points,
        COALESCE(fps.fair_play_points, 0) as fair_play_points
    FROM aggregated_stats ags
    JOIN public.teams t ON ags.team_id = t.id
    LEFT JOIN head_to_head_stats hhs ON t.id = hhs.team_id
    LEFT JOIN fair_play_stats fps ON t.id = fps.team_id
    ORDER BY
        ags.pts DESC,
        COALESCE(hhs.h2h_points, -1) DESC,
        COALESCE(hhs.h2h_goal_difference, -999) DESC,
        COALESCE(hhs.h2h_goals_for, -1) DESC,
        ags.goal_difference DESC,
        ags.goals_for DESC,
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
            cm.home_team_id AS team_id,
            1 AS matches_played,
            CASE WHEN cm.home_score > cm.away_score THEN 3 WHEN cm.home_score = cm.away_score THEN 1 ELSE 0 END AS pts,
            cm.home_score AS goals_for,
            cm.away_score AS goals_against
        FROM completed_matches cm
        UNION ALL
        SELECT
            cm.away_team_id AS team_id,
            1 AS matches_played,
            CASE WHEN cm.away_score > cm.home_score THEN 3 WHEN cm.away_score = cm.home_score THEN 1 ELSE 0 END AS pts,
            cm.away_score AS goals_for,
            cm.home_score AS goals_against
        FROM completed_matches cm
    ),
    aggregated_stats AS (
        SELECT
            ts.team_id,
            SUM(ts.matches_played) AS matches_played,
            SUM(CASE WHEN ts.pts = 3 THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN ts.pts = 1 THEN 1 ELSE 0 END) AS draws,
            SUM(CASE WHEN ts.pts = 0 THEN 1 ELSE 0 END) AS losses,
            SUM(ts.goals_for) AS goals_for,
            SUM(ts.goals_against) AS goals_against,
            SUM(ts.goals_for) - SUM(ts.goals_against) AS goal_difference,
            SUM(ts.pts) AS pts
        FROM team_stats ts
        GROUP BY ts.team_id
    ),
    tied_groups AS (
        SELECT
            ags.pts AS tied_pts,
            array_agg(ags.team_id) as teams
        FROM aggregated_stats ags
        GROUP BY ags.pts
        HAVING count(*) > 1
    ),
    head_to_head_stats AS (
        SELECT
            hth.team_id,
            SUM(hth.pts) as h2h_points,
            SUM(hth.goals_for) - SUM(hth.goals_against) as h2h_goal_difference,
            SUM(hth.goals_for) as h2h_goals_for
        FROM (
            SELECT
                cm.home_team_id as team_id,
                CASE WHEN cm.home_score > cm.away_score THEN 3 WHEN cm.home_score = cm.away_score THEN 1 ELSE 0 END as pts,
                cm.home_score as goals_for,
                cm.away_score as goals_against
            FROM completed_matches cm
            JOIN tied_groups tg ON cm.home_team_id = ANY(tg.teams) AND cm.away_team_id = ANY(tg.teams)
            UNION ALL
            SELECT
                cm.away_team_id as team_id,
                CASE WHEN cm.away_score > cm.home_score THEN 3 WHEN cm.away_score = cm.home_score THEN 1 ELSE 0 END as pts,
                cm.away_score as goals_for,
                cm.home_score as goals_against
            FROM completed_matches cm
            JOIN tied_groups tg ON cm.home_team_id = ANY(tg.teams) AND cm.away_team_id = ANY(tg.teams)
        ) hth
        GROUP BY hth.team_id
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
    LEFT JOIN aggregated_stats ags ON t.id = ags.team_id
    LEFT JOIN head_to_head_stats hhs ON t.id = hhs.team_id
    WHERE t.id IN (SELECT team_id FROM aggregated_stats)
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
