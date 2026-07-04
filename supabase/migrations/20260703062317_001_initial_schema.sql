/*
# Smart College Management System - Initial Schema

1. New Tables
- `departments` - Academic departments
- `branches` - Specializations within departments
- `semesters` - Academic semesters (1-8)
- `sections` - Class sections within semesters
- `classrooms` - Physical rooms and labs
- `subjects` - Course subjects
- `faculty_subjects` - Faculty-subject assignments
- `profiles` - User profiles extending auth.users (role-based)
- `students` - Student records with academic info
- `faculty` - Faculty records with department association
- `timetables` - Class schedules
- `attendance` - Daily attendance records
- `internal_marks` - Student internal assessment marks
- `assignments` - Assignments created by faculty
- `assignment_submissions` - Student assignment submissions
- `study_materials` - Uploaded learning resources
- `applications` - AI-generated student applications
- `notices` - Official announcements
- `notifications` - User notifications
- `events` - Academic events and activities

2. Security
- RLS enabled on all tables
- Owner-scoped policies for authenticated users
- Admin role has full access to all tables
*/

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  description text,
  hod_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Branches (specializations)
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Semesters
CREATE TABLE IF NOT EXISTS semesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number int NOT NULL UNIQUE CHECK (number BETWEEN 1 AND 8),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Sections
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  semester_id uuid NOT NULL REFERENCES semesters(id),
  name text NOT NULL,
  capacity int DEFAULT 60,
  created_at timestamptz DEFAULT now(),
  UNIQUE(branch_id, semester_id, name)
);

-- Classrooms
CREATE TABLE IF NOT EXISTS classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  building text,
  floor int,
  capacity int DEFAULT 60,
  type text DEFAULT 'lecture' CHECK (type IN ('lecture', 'lab', 'seminar', 'auditorium')),
  facilities jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES semesters(id),
  credits int DEFAULT 3,
  type text DEFAULT 'theory' CHECK (type IN ('theory', 'lab', 'practical', 'project')),
  hours_per_week int DEFAULT 4,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Profiles (extends auth.users with role)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
  phone text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Faculty
CREATE TABLE IF NOT EXISTS faculty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text NOT NULL UNIQUE,
  department_id uuid NOT NULL REFERENCES departments(id),
  designation text DEFAULT 'Assistant Professor',
  qualification text,
  specialization text,
  joining_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'retired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Faculty_Subjects (assignments)
CREATE TABLE IF NOT EXISTS faculty_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  is_primary boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(faculty_id, subject_id, section_id, academic_year)
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_no text NOT NULL UNIQUE,
  roll_no text NOT NULL,
  section_id uuid NOT NULL REFERENCES sections(id),
  branch_id uuid NOT NULL REFERENCES branches(id),
  semester_id uuid NOT NULL REFERENCES semesters(id),
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  address text,
  guardian_name text,
  guardian_phone text,
  admission_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'graduated', 'dropped')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Timetables
CREATE TABLE IF NOT EXISTS timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES faculty(id),
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  classroom_id uuid REFERENCES classrooms(id),
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  academic_year text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(section_id, day_of_week, start_time, academic_year)
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id),
  faculty_id uuid REFERENCES faculty(id),
  date date NOT NULL,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  remarks text,
  marked_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id, date)
);

-- Internal Marks
CREATE TABLE IF NOT EXISTS internal_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id),
  faculty_id uuid REFERENCES faculty(id),
  exam_type text NOT NULL CHECK (exam_type IN ('internal1', 'internal2', 'assignment', 'project', 'quiz')),
  max_marks numeric DEFAULT 20,
  obtained_marks numeric NOT NULL,
  date date DEFAULT CURRENT_DATE,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid NOT NULL REFERENCES faculty(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  section_id uuid NOT NULL REFERENCES sections(id),
  title text NOT NULL,
  description text,
  due_date timestamptz NOT NULL,
  max_marks numeric DEFAULT 100,
  attachments jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  content text,
  attachments jsonb DEFAULT '[]'::jsonb,
  submitted_at timestamptz DEFAULT now(),
  marks_obtained numeric,
  feedback text,
  graded_by uuid REFERENCES auth.users(id),
  graded_at timestamptz,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned', 'late')),
  UNIQUE(assignment_id, student_id)
);

-- Study Materials
CREATE TABLE IF NOT EXISTS study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid NOT NULL REFERENCES faculty(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  section_id uuid REFERENCES sections(id),
  title text NOT NULL,
  description text,
  type text DEFAULT 'notes' CHECK (type IN ('notes', 'ppt', 'video', 'document', 'link')),
  url text,
  file_path text,
  file_name text,
  file_size bigint,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Applications (AI-generated)
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  faculty_id uuid NOT NULL REFERENCES faculty(id),
  subject_id uuid REFERENCES subjects(id),
  application_type text NOT NULL CHECK (application_type IN (
    'leave_request', 'assignment_extension', 'project_approval', 
    'internship_permission', 'bonafide_certificate', 'scholarship_request',
    'general_request', 'exam_rejoin', 'attendance_regularization'
  )),
  original_reason text,
  generated_content text,
  ai_model text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'viewed', 'approved', 'rejected', 'closed')),
  faculty_comments text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notices
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES auth.users(id),
  target_audience jsonb DEFAULT '["all"]'::jsonb,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_published boolean DEFAULT false,
  published_at timestamptz,
  expires_at timestamptz,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text NOT NULL CHECK (type IN (
    'application', 'notice', 'attendance', 'assignment', 
    'result', 'timetable', 'reminder', 'system'
  )),
  reference_id uuid,
  reference_type text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'other' CHECK (event_type IN ('workshop', 'seminar', 'exam', 'holiday', 'meeting', 'other')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  venue text,
  organizer_id uuid REFERENCES auth.users(id),
  target_audience jsonb DEFAULT '["all"]'::jsonb,
  max_participants int,
  registration_required boolean DEFAULT false,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event Registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  registered_at timestamptz DEFAULT now(),
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  UNIQUE(event_id, student_id)
);

-- Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year text NOT NULL UNIQUE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is faculty
CREATE OR REPLACE FUNCTION is_faculty()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is student
CREATE OR REPLACE FUNCTION is_student()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get student_id for current user
CREATE OR REPLACE FUNCTION get_student_id()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT id FROM students WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get faculty_id for current user
CREATE OR REPLACE FUNCTION get_faculty_id()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT id FROM faculty WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated USING (is_admin() OR id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Admin has full access to all tables
-- Departments
DROP POLICY IF EXISTS "departments_all" ON departments;
CREATE POLICY "departments_all" ON departments FOR ALL
  TO authenticated USING (is_admin() OR true)
  WITH CHECK (is_admin());

-- Branches
DROP POLICY IF EXISTS "branches_all" ON branches;
CREATE POLICY "branches_all" ON branches FOR ALL
  TO authenticated USING (is_admin() OR true)
  WITH CHECK (is_admin());

-- Semesters
DROP POLICY IF EXISTS "semesters_all" ON semesters;
CREATE POLICY "semesters_all" ON semesters FOR ALL
  TO authenticated USING (is_admin() OR true)
  WITH CHECK (is_admin());

-- Sections
DROP POLICY IF EXISTS "sections_all" ON sections;
CREATE POLICY "sections_all" ON sections FOR ALL
  TO authenticated USING (is_admin() OR true)
  WITH CHECK (is_admin());

-- Classrooms
DROP POLICY IF EXISTS "classrooms_all" ON classrooms;
CREATE POLICY "classrooms_all" ON classrooms FOR ALL
  TO authenticated USING (is_admin() OR true)
  WITH CHECK (is_admin());

-- Subjects
DROP POLICY IF EXISTS "subjects_all" ON subjects;
CREATE POLICY "subjects_all" ON subjects FOR ALL
  TO authenticated USING (is_admin() OR true)
  WITH CHECK (is_admin());

-- Faculty
DROP POLICY IF EXISTS "faculty_select" ON faculty;
CREATE POLICY "faculty_select" ON faculty FOR SELECT
  TO authenticated USING (is_admin() OR is_faculty() OR is_student());

DROP POLICY IF EXISTS "faculty_insert" ON faculty;
CREATE POLICY "faculty_insert" ON faculty FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "faculty_update" ON faculty;
CREATE POLICY "faculty_update" ON faculty FOR UPDATE
  TO authenticated USING (is_admin() OR user_id = auth.uid());

-- Faculty Subjects
DROP POLICY IF EXISTS "faculty_subjects_select" ON faculty_subjects;
CREATE POLICY "faculty_subjects_select" ON faculty_subjects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "faculty_subjects_insert" ON faculty_subjects;
CREATE POLICY "faculty_subjects_insert" ON faculty_subjects FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "faculty_subjects_update" ON faculty_subjects;
CREATE POLICY "faculty_subjects_update" ON faculty_subjects FOR UPDATE
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "faculty_subjects_delete" ON faculty_subjects;
CREATE POLICY "faculty_subjects_delete" ON faculty_subjects FOR DELETE
  TO authenticated USING (is_admin());

-- Students
DROP POLICY IF EXISTS "students_select" ON students;
CREATE POLICY "students_select" ON students FOR SELECT
  TO authenticated USING (is_admin() OR is_faculty() OR user_id = auth.uid());

DROP POLICY IF EXISTS "students_insert" ON students;
CREATE POLICY "students_insert" ON students FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "students_update" ON students;
CREATE POLICY "students_update" ON students FOR UPDATE
  TO authenticated USING (is_admin() OR user_id = auth.uid());

-- Timetables
DROP POLICY IF EXISTS "timetables_select" ON timetables;
CREATE POLICY "timetables_select" ON timetables FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "timetables_insert" ON timetables;
CREATE POLICY "timetables_insert" ON timetables FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "timetables_update" ON timetables;
CREATE POLICY "timetables_update" ON timetables FOR UPDATE
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "timetables_delete" ON timetables;
CREATE POLICY "timetables_delete" ON timetables FOR DELETE
  TO authenticated USING (is_admin());

-- Attendance
DROP POLICY IF EXISTS "attendance_select" ON attendance;
CREATE POLICY "attendance_select" ON attendance FOR SELECT
  TO authenticated USING (
    is_admin() OR 
    EXISTS (SELECT 1 FROM faculty WHERE user_id = auth.uid()) OR
    student_id = get_student_id()
  );

DROP POLICY IF EXISTS "attendance_insert" ON attendance;
CREATE POLICY "attendance_insert" ON attendance FOR INSERT
  TO authenticated WITH CHECK (is_admin() OR is_faculty());

DROP POLICY IF EXISTS "attendance_update" ON attendance;
CREATE POLICY "attendance_update" ON attendance FOR UPDATE
  TO authenticated USING (is_admin() OR is_faculty());

-- Internal Marks
DROP POLICY IF EXISTS "internal_marks_select" ON internal_marks;
CREATE POLICY "internal_marks_select" ON internal_marks FOR SELECT
  TO authenticated USING (
    is_admin() OR 
    is_faculty() OR 
    student_id = get_student_id()
  );

DROP POLICY IF EXISTS "internal_marks_insert" ON internal_marks;
CREATE POLICY "internal_marks_insert" ON internal_marks FOR INSERT
  TO authenticated WITH CHECK (is_admin() OR is_faculty());

DROP POLICY IF EXISTS "internal_marks_update" ON internal_marks;
CREATE POLICY "internal_marks_update" ON internal_marks FOR UPDATE
  TO authenticated USING (is_admin() OR is_faculty());

-- Assignments
DROP POLICY IF EXISTS "assignments_select" ON assignments;
CREATE POLICY "assignments_select" ON assignments FOR SELECT
  TO authenticated USING (
    is_admin() OR 
    faculty_id = get_faculty_id() OR
    is_student()
  );

DROP POLICY IF EXISTS "assignments_insert" ON assignments;
CREATE POLICY "assignments_insert" ON assignments FOR INSERT
  TO authenticated WITH CHECK (is_admin() OR is_faculty());

DROP POLICY IF EXISTS "assignments_update" ON assignments;
CREATE POLICY "assignments_update" ON assignments FOR UPDATE
  TO authenticated USING (is_admin() OR faculty_id = get_faculty_id());

DROP POLICY IF EXISTS "assignments_delete" ON assignments;
CREATE POLICY "assignments_delete" ON assignments FOR DELETE
  TO authenticated USING (is_admin() OR faculty_id = get_faculty_id());

-- Assignment Submissions
DROP POLICY IF EXISTS "assignment_submissions_select" ON assignment_submissions;
CREATE POLICY "assignment_submissions_select" ON assignment_submissions FOR SELECT
  TO authenticated USING (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM assignments a 
      WHERE a.id = assignment_id AND a.faculty_id = get_faculty_id()
    ) OR
    student_id = get_student_id()
  );

DROP POLICY IF EXISTS "assignment_submissions_insert" ON assignment_submissions;
CREATE POLICY "assignment_submissions_insert" ON assignment_submissions FOR INSERT
  TO authenticated WITH CHECK (is_admin() OR is_student());

DROP POLICY IF EXISTS "assignment_submissions_update" ON assignment_submissions;
CREATE POLICY "assignment_submissions_update" ON assignment_submissions FOR UPDATE
  TO authenticated USING (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM assignments a 
      WHERE a.id = assignment_id AND a.faculty_id = get_faculty_id()
    )
  );

-- Study Materials
DROP POLICY IF EXISTS "study_materials_select" ON study_materials;
CREATE POLICY "study_materials_select" ON study_materials FOR SELECT
  TO authenticated USING (is_public OR is_admin() OR faculty_id = get_faculty_id() OR is_student());

DROP POLICY IF EXISTS "study_materials_insert" ON study_materials;
CREATE POLICY "study_materials_insert" ON study_materials FOR INSERT
  TO authenticated WITH CHECK (is_admin() OR is_faculty());

DROP POLICY IF EXISTS "study_materials_update" ON study_materials;
CREATE POLICY "study_materials_update" ON study_materials FOR UPDATE
  TO authenticated USING (is_admin() OR faculty_id = get_faculty_id());

DROP POLICY IF EXISTS "study_materials_delete" ON study_materials;
CREATE POLICY "study_materials_delete" ON study_materials FOR DELETE
  TO authenticated USING (is_admin() OR faculty_id = get_faculty_id());

-- Applications
DROP POLICY IF EXISTS "applications_select" ON applications;
CREATE POLICY "applications_select" ON applications FOR SELECT
  TO authenticated USING (
    is_admin() OR 
    faculty_id = get_faculty_id() OR
    student_id = get_student_id()
  );

DROP POLICY IF EXISTS "applications_insert" ON applications;
CREATE POLICY "applications_insert" ON applications FOR INSERT
  TO authenticated WITH CHECK (is_admin() OR is_student());

DROP POLICY IF EXISTS "applications_update" ON applications;
CREATE POLICY "applications_update" ON applications FOR UPDATE
  TO authenticated USING (
    is_admin() OR 
    faculty_id = get_faculty_id() OR
    student_id = get_student_id()
  );

-- Notices
DROP POLICY IF EXISTS "notices_select" ON notices;
CREATE POLICY "notices_select" ON notices FOR SELECT
  TO authenticated USING (is_published OR is_admin());

DROP POLICY IF EXISTS "notices_insert" ON notices;
CREATE POLICY "notices_insert" ON notices FOR INSERT
  TO authenticated WITH CHECK (is_admin() OR is_faculty());

DROP POLICY IF EXISTS "notices_update" ON notices;
CREATE POLICY "notices_update" ON notices FOR UPDATE
  TO authenticated USING (is_admin() OR author_id = auth.uid());

DROP POLICY IF EXISTS "notices_delete" ON notices;
CREATE POLICY "notices_delete" ON notices FOR DELETE
  TO authenticated USING (is_admin());

-- Notifications
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  TO authenticated WITH CHECK (is_admin() OR true);

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR is_admin());

-- Events
DROP POLICY IF EXISTS "events_select" ON events;
CREATE POLICY "events_select" ON events FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "events_insert" ON events;
CREATE POLICY "events_insert" ON events FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "events_update" ON events;
CREATE POLICY "events_update" ON events FOR UPDATE
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "events_delete" ON events;
CREATE POLICY "events_delete" ON events FOR DELETE
  TO authenticated USING (is_admin());

-- Event Registrations
DROP POLICY IF EXISTS "event_registrations_select" ON event_registrations;
CREATE POLICY "event_registrations_select" ON event_registrations FOR SELECT
  TO authenticated USING (is_admin() OR student_id = get_student_id());

DROP POLICY IF EXISTS "event_registrations_insert" ON event_registrations;
CREATE POLICY "event_registrations_insert" ON event_registrations FOR INSERT
  TO authenticated WITH CHECK (is_admin() OR is_student());

DROP POLICY IF EXISTS "event_registrations_update" ON event_registrations;
CREATE POLICY "event_registrations_update" ON event_registrations FOR UPDATE
  TO authenticated USING (is_admin());

-- Academic Years
DROP POLICY IF EXISTS "academic_years_select" ON academic_years;
CREATE POLICY "academic_years_select" ON academic_years FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "academic_years_insert" ON academic_years;
CREATE POLICY "academic_years_insert" ON academic_years FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "academic_years_update" ON academic_years;
CREATE POLICY "academic_years_update" ON academic_years FOR UPDATE
  TO authenticated USING (is_admin());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_section_id ON students(section_id);
CREATE INDEX IF NOT EXISTS idx_students_branch_id ON students(branch_id);
CREATE INDEX IF NOT EXISTS idx_students_semester_id ON students(semester_id);
CREATE INDEX IF NOT EXISTS idx_faculty_user_id ON faculty(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_department_id ON faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_faculty_id ON applications(faculty_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_timetables_section_id ON timetables(section_id);
CREATE INDEX IF NOT EXISTS idx_timetables_faculty_id ON timetables(faculty_id);