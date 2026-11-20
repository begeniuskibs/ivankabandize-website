select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'resource_downloads'
  and column_name = 'intended_use';
