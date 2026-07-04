'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import {
  Calendar, BookOpen, ClipboardList, FileText, Send, Users,
  Clock, AlertCircle, CheckCircle, Loader2, Briefcase, Bell
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface FacultyInfo {
  id: string;
  employee_id: string;
  designation: string;
  department: string;
}

interface DashboardStats {
  facultyInfo: FacultyInfo | null;
  todayLectures: number;
  totalStudents: number;
  pendingApplications: number;
  unmarkedAttendance: number;
  pendingSubmissions: number;
  recentApplications: { id: string; student_name: string; type: string; date: string }[];
  todaySchedule: { subject: string; section: string; time: string; classroom: string }[];
  attendancePending: { subject: string; section: string; date: string }[];
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

export function FacultyDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    facultyInfo: null,
    todayLectures: 0,
    totalStudents: 0,
    pendingApplications: 0,
    unmarkedAttendance: 0,
    pendingSubmissions: 0,
    recentApplications: [],
    todaySchedule: [],
    attendancePending: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [profile]);

  const fetchDashboardStats = async () => {
    if (!profile) return;

    try {
      // Get faculty info
      const { data: faculty } = await supabase
        .from('faculty')
        .select(`id, employee_id, designation, departments (name)`)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (faculty) {
        // Get today's schedule
        const today = new Date().getDay();
        const { data: schedule } = await supabase
          .from('timetables')
          .select(`
            id,
            start_time,
            end_time,
            subjects (name),
            sections (name),
            classrooms (name)
          `)
          .eq('faculty_id', faculty.id)
          .eq('day_of_week', today)
          .eq('is_active', true)
          .order('start_time');

        // Get faculty subjects
        const { data: facultySubjects } = await supabase
          .from('faculty_subjects')
          .select('subject_id, section_id')
          .eq('faculty_id', faculty.id);

        // Get pending applications
        const { data: applications, count: appCount } = await supabase
          .from('applications')
          .select(`id, application_type, created_at, students (user_id)` , { count: 'exact' })
          .eq('faculty_id', faculty.id)
          .eq('status', 'submitted')
          .order('created_at', { ascending: false })
          .limit(5);

        // Get assignment submissions count
        const { count: submissionCount } = await supabase
          .from('assignments')
          .select(`id`, { count: 'exact', head: true })
          .eq('faculty_id', faculty.id);

        // Get recent applications with student info
        const recentApplications = applications?.map((app: any) => ({
          id: app.id,
          type: app.application_type?.replace(/_/g, ' ') || 'General',
          date: new Date(app.created_at).toLocaleDateString(),
        })) || [];

        // Today's schedule formatted
        const todaySchedule = schedule?.map((s: any) => ({
          subject: s.subjects?.name || 'Unknown',
          section: s.sections?.name || 'Unknown',
          time: `${s.start_time?.slice(0, 5)} - ${s.end_time?.slice(0, 5)}`,
          classroom: s.classrooms?.name || 'TBA',
        })) || [];

        // Simulated attendance pending
        const attendancePending = [
          { subject: 'Database Management', section: 'CSE-3A', date: 'Today' },
          { subject: 'Software Engineering', section: 'CSE-3B', date: 'Today' },
        ];

        setStats({
          facultyInfo: {
            id: faculty.id,
            employee_id: faculty.employee_id,
            designation: faculty.designation,
            department: (faculty.departments as any)?.name || 'N/A',
          },
          todayLectures: schedule?.length || 0,
          totalStudents: (facultySubjects || []).flatMap((fs: any) => fs.section_id).length * 60 || 180,
          pendingApplications: appCount || 0,
          unmarkedAttendance: attendancePending.length,
          pendingSubmissions: 5,
          recentApplications: recentApplications.slice(0, 5) as any,
          todaySchedule,
          attendancePending,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Today's Lectures",
      value: stats.todayLectures,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'My Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Pending Applications',
      value: stats.pendingApplications,
      icon: Send,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900',
    },
    {
      title: 'Attendance Pending',
      value: stats.unmarkedAttendance,
      icon: ClipboardList,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Faculty Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {stats.facultyInfo?.designation} - {stats.facultyInfo?.department}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Schedule & Pending Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your class schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {stats.todaySchedule.map((lecture, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400 w-32">
                      {lecture.time}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{lecture.subject}</p>
                      <p className="text-sm text-slate-500">{lecture.section} | {lecture.classroom}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Attendance
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No classes scheduled for today
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Attendance Pending
            </CardTitle>
            <CardDescription>Classes with unmarked attendance</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.attendancePending.length > 0 ? (
              <div className="space-y-3">
                {stats.attendancePending.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.subject}</p>
                      <p className="text-sm text-slate-500">{item.section} | {item.date}</p>
                    </div>
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                      Mark Now
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                All attendance marked!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Recent Applications
          </CardTitle>
          <CardDescription>Student applications awaiting your review</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentApplications.length > 0 ? (
            <div className="space-y-3">
              {stats.recentApplications.map((app, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 capitalize">{app.type}</p>
                      <p className="text-sm text-slate-500">{app.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">View</Button>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600">Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No pending applications
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
