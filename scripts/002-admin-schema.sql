-- =============================================
-- DEESHA FOUNDATION ADMIN PANEL DATABASE SCHEMA
-- =============================================

-- Admin Users Table with Roles
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'FINANCE')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects/Programs Table (replaces static data)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  image TEXT,
  category TEXT NOT NULL CHECK (category IN ('education', 'health', 'empowerment', 'relief')),
  location TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'urgent', 'draft')),
  raised DECIMAL(10, 2) DEFAULT 0,
  goal DECIMAL(10, 2),
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Metrics Table
CREATE TABLE IF NOT EXISTS project_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Project Timeline Table
CREATE TABLE IF NOT EXISTS project_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  date_range TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'current', 'upcoming')),
  sort_order INTEGER DEFAULT 0
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  image TEXT,
  email TEXT,
  phone TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('upcoming', 'past')),
  is_published BOOLEAN DEFAULT FALSE,
  max_capacity INTEGER,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stories/News Table
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT,
  image TEXT,
  category TEXT NOT NULL,
  author_id UUID REFERENCES admin_users(id),
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  read_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partners & Donors Table
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT,
  website TEXT,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('partner', 'donor', 'sponsor')),
  is_published BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Impact Statistics Table
CREATE TABLE IF NOT EXISTS impact_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  progress INTEGER,
  category TEXT CHECK (category IN ('home', 'impact')),
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Log for Audit Trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get admin role
CREATE OR REPLACE FUNCTION get_admin_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = TRUE;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin Users Policies
CREATE POLICY "Admin users can view all admins" ON admin_users 
  FOR SELECT USING (is_admin_user());

CREATE POLICY "Super admins can manage users" ON admin_users 
  FOR ALL USING (get_admin_role() = 'SUPER_ADMIN');

-- Projects Policies
CREATE POLICY "Public can view published projects" ON projects 
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admins can view all projects" ON projects 
  FOR SELECT USING (is_admin_user());

CREATE POLICY "Editors and above can manage projects" ON projects 
  FOR ALL USING (get_admin_role() IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

-- Project Metrics Policies
CREATE POLICY "Public can view metrics for published projects" ON project_metrics 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_metrics.project_id AND projects.is_published = TRUE)
  );

CREATE POLICY "Admins can manage metrics" ON project_metrics 
  FOR ALL USING (get_admin_role() IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

-- Project Timeline Policies
CREATE POLICY "Public can view timeline for published projects" ON project_timeline 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_timeline.project_id AND projects.is_published = TRUE)
  );

CREATE POLICY "Admins can manage timeline" ON project_timeline 
  FOR ALL USING (get_admin_role() IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

-- Team Members Policies
CREATE POLICY "Public can view published team members" ON team_members 
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admins can manage team members" ON team_members 
  FOR ALL USING (get_admin_role() IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

-- Events Policies
CREATE POLICY "Public can view published events" ON events 
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admins can manage events" ON events 
  FOR ALL USING (get_admin_role() IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

-- Stories Policies
CREATE POLICY "Public can view published stories" ON stories 
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admins can manage stories" ON stories 
  FOR ALL USING (get_admin_role() IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

-- Partners Policies
CREATE POLICY "Public can view published partners" ON partners 
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admins can manage partners" ON partners 
  FOR ALL USING (get_admin_role() IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

-- Impact Stats Policies
CREATE POLICY "Public can view published stats" ON impact_stats 
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admins can manage stats" ON impact_stats 
  FOR ALL USING (get_admin_role() IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

-- Site Settings Policies
CREATE POLICY "Public can view settings" ON site_settings 
  FOR SELECT USING (TRUE);

CREATE POLICY "Super admins can manage settings" ON site_settings 
  FOR ALL USING (get_admin_role() IN ('SUPER_ADMIN', 'ADMIN'));

-- Activity Logs Policies
CREATE POLICY "Admins can view logs" ON activity_logs 
  FOR SELECT USING (is_admin_user());

CREATE POLICY "System can insert logs" ON activity_logs 
  FOR INSERT WITH CHECK (TRUE);

-- Donations Policies (add to existing table)
CREATE POLICY "Finance and admins can view donations" ON donations 
  FOR SELECT USING (get_admin_role() IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE'));

-- Contact Submissions Policies
CREATE POLICY "Admins can view contact submissions" ON contact_submissions 
  FOR SELECT USING (is_admin_user());

-- Newsletter Policies
CREATE POLICY "Admins can view subscriptions" ON newsletter_subscriptions 
  FOR SELECT USING (is_admin_user());

-- Volunteer Policies
CREATE POLICY "Admins can view volunteers" ON volunteer_applications 
  FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can update volunteers" ON volunteer_applications 
  FOR UPDATE USING (get_admin_role() IN ('SUPER_ADMIN', 'ADMIN'));

-- Event Registrations Policies
CREATE POLICY "Admins can view registrations" ON event_registrations 
  FOR SELECT USING (is_admin_user());

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_published ON projects(is_published);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_stories_slug ON stories(slug);
CREATE INDEX IF NOT EXISTS idx_stories_published ON stories(is_published);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
