-- Migration: Event-based scheduling support
-- Adds columns to matches for event scheduling mode

ALTER TABLE matches ADD COLUMN match_day integer NULL;
COMMENT ON COLUMN matches.match_day IS 'Giornata di campionato (match day number within a phase)';

ALTER TABLE matches ADD COLUMN match_duration_minutes integer NULL;
COMMENT ON COLUMN matches.match_duration_minutes IS 'Durata della partita in minuti (usato in modalità event per calcolare gli slot orari)';
