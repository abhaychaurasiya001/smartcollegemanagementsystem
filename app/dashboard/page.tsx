'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users, GraduationCap, Building2, Calendar, FileText, Bell,
  Clock, BookOpen, ClipboardList, Send, AlertCircle, CheckCircle,
  Activity, TrendingUp, UserCheck, UserX
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { FacultyDashboard } from '@/components/dashboards/faculty-dashboard';
import { StudentDashboard } from '@/components/dashboards/student-dashboard';

export default function DashboardPage() {
  const { profile } = useAuth();

  if (!profile) return null;

  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'faculty':
      return <FacultyDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return <StudentDashboard />;
  }
}
