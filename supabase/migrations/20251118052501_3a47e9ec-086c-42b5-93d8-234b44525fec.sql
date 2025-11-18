-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create role enum
CREATE TYPE public.user_role AS ENUM ('admin', 'compliance_lead', 'ai_system_owner', 'auditor');

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Systems table
CREATE TABLE public.ai_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  business_unit TEXT,
  geography TEXT,
  data_type TEXT,
  model_type TEXT,
  training_source TEXT,
  deployment_environment TEXT,
  risk_level TEXT DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment templates enum
CREATE TYPE public.assessment_template AS ENUM ('eu_ai_act', 'nist_ai_rmf', 'iso_42001');

-- Assessments table
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ai_system_id UUID REFERENCES public.ai_systems(id) ON DELETE CASCADE,
  template assessment_template NOT NULL,
  risk_level TEXT,
  eu_ai_act_category TEXT,
  nist_score INTEGER,
  iso_readiness_score INTEGER,
  recommended_actions TEXT[],
  assessment_data JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  due_date DATE,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  ai_system_id UUID REFERENCES public.ai_systems(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  ai_system_id UUID REFERENCES public.ai_systems(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence table
CREATE TABLE public.evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  ai_system_id UUID REFERENCES public.ai_systems(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for ai_systems
CREATE POLICY "Authenticated users can view ai_systems"
  ON public.ai_systems FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and compliance leads can insert ai_systems"
  ON public.ai_systems FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'compliance_lead') OR
    public.has_role(auth.uid(), 'ai_system_owner')
  );

CREATE POLICY "Admins and compliance leads can update ai_systems"
  ON public.ai_systems FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'compliance_lead') OR
    created_by = auth.uid()
  );

CREATE POLICY "Admins can delete ai_systems"
  ON public.ai_systems FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for assessments
CREATE POLICY "Authenticated users can view assessments"
  ON public.assessments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and compliance leads can insert assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'compliance_lead')
  );

CREATE POLICY "Admins and compliance leads can update assessments"
  ON public.assessments FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'compliance_lead')
  );

CREATE POLICY "Admins can delete assessments"
  ON public.assessments FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tasks
CREATE POLICY "Authenticated users can view tasks"
  ON public.tasks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Non-auditors can insert tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (NOT public.has_role(auth.uid(), 'auditor'));

CREATE POLICY "Users can update their tasks"
  ON public.tasks FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'compliance_lead') OR
    created_by = auth.uid()
  );

CREATE POLICY "Admins can delete tasks"
  ON public.tasks FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for documents
CREATE POLICY "Authenticated users can view documents"
  ON public.documents FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Non-auditors can insert documents"
  ON public.documents FOR INSERT
  WITH CHECK (NOT public.has_role(auth.uid(), 'auditor'));

CREATE POLICY "Creators and admins can update documents"
  ON public.documents FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    created_by = auth.uid()
  );

CREATE POLICY "Admins can delete documents"
  ON public.documents FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for evidence
CREATE POLICY "Authenticated users can view evidence"
  ON public.evidence FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Non-auditors can insert evidence"
  ON public.evidence FOR INSERT
  WITH CHECK (NOT public.has_role(auth.uid(), 'auditor'));

CREATE POLICY "Admins can delete evidence"
  ON public.evidence FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ai_systems_updated_at
  BEFORE UPDATE ON public.ai_systems
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();