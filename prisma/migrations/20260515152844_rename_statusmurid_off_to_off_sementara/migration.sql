-- Safe rename: StatusMurid enum value OFF -> OFF_SEMENTARA
-- Using ALTER TYPE ... RENAME VALUE which preserves existing data in PostgreSQL 10+
-- This does NOT drop/recreate the enum, so all existing rows with 'OFF' will be automatically renamed to 'OFF_SEMENTARA'

ALTER TYPE "StatusMurid" RENAME VALUE 'OFF' TO 'OFF_SEMENTARA';
