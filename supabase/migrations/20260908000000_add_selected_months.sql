-- Persist the Monthly Review month selection per user (synced across devices)
ALTER TABLE user_settings
  ADD COLUMN selected_months jsonb DEFAULT '[0,1,2,3,4,5,6,7,8,9,10,11]'::jsonb NOT NULL;
