import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lbiinyxxfokbocnovxrw.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiaWlueXh4Zm9rYm9jbm92eHJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1ODQxODIsImV4cCI6MjA3NjE2MDE4Mn0.uodbXjP7MzbtMvqoVUCFoDTk0aQGDHLeYE58mdIS9ic";
export const supabase = createClient(supabaseUrl, supabaseKey);
