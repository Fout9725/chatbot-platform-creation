UPDATE geo_tenants
   SET pub_check_enabled = TRUE,
       pub_check_interval_hours = 48
 WHERE pub_check_enabled IS NOT TRUE
    OR pub_check_interval_hours IS NULL
    OR pub_check_interval_hours <> 48;

ALTER TABLE geo_tenants ALTER COLUMN pub_check_interval_hours SET DEFAULT 48;
ALTER TABLE geo_tenants ALTER COLUMN pub_check_enabled SET DEFAULT TRUE;
