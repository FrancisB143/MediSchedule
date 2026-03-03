-- ============================================
-- FIX: Expand status column to accommodate full status names
-- ============================================
-- This fixes the "value too long for type character varying(20)" error
-- Run this BEFORE running test-shift-swap-sample.sql

ALTER TABLE shift_swap_requests 
ALTER COLUMN status TYPE VARCHAR(50);

-- Verify the change
\d shift_swap_requests;
