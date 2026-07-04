'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import {
  Calendar, BookOpen, ClipboardList, FileText, Send,
  Megaphone, Trophy, Loader2, CheckCircle, AlertTriangle, Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface StudentInfo {
  enrollment_no: string;
  section: string;
  branch: string;
  semester: number;
}

interface DashboardStats {
  studentInfo: StudentInfo | null;
  attendancePercentage: number;
  pendingAssignments: number;
  totalSubjects: number;
  upcomingExams: number;
  applicationStatus: { pending: number; approved: number; rejected: number };
  todaySchedule: { subject: string; time: string; faculty: string; classroom: string }[];
  recentNotices: { title: string; date: string; priority: string }[];
  pendingAssignmentsList: { title: string; subject: string; dueDate: string }[];
}

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export function StudentDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    studentInfo: null,
    attendancePercentage: 0,
    pendingAssignments: 0,
    totalSubjects: 5,
    upcomingExams: 0,
    applicationStatus: { pending: 0, approved: 0, rejected: 0 },
    todaySchedule: [],
    recentNotices: [],
    pendingAssignmentsList: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [profile]);

  const fetchDashboardStats = async () => {
    if (!profile) return;

    try {
      // Get student info
      const { data: student } = await supabase
        .from('students')
        .select(`
          id,
          enrollment_no,
          sections (id, name),
          branches (name),
          semesters (number)
        `)
        .eq('user_id', profile.id)
        .maybeSingle() as any;

      if (student) {
        // Get today's schedule
        const today = new Date().getDay();
        const { data: schedule } = await supabase
          .from('timetables')
          .select(`
            start_time,
            end_time,
            subjects (name),
            faculty_id,
            classrooms (name)
          `)
          .eq('section_id', student?.sections?.id)
          .eq('day_of_week', today)
          .eq('is_active', true)
          .order('start_time');

        // Get attendance
        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('student_id', student?.id);

        const present = attendance?.filter(a => a.status === 'present').length || 0;
        const total = attendance?.length || 1;
        const attendancePercentage = Math.round((present / total) * 100);

        // Get pending assignments
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id, title, due_date, subjects (name)')
          .eq('section_id', student?.sections?.id)
          .eq('status', 'active')
          .gte('due_date', new Date().toISOString())
          .order('due_date', { ascending: true })
          .limit(5);

        // Application status
        const { data: applications } = await supabase
          .from('applications')
          .select('status')
          .eq('student_id', student?.id);

        // Recent notices
        const { data: notices } = await supabase
          .from('notices')
          .select('title, created_at, priority')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(5);

        // Today's schedule formatted
        const todaySchedule = schedule?.map((s: any) => ({
          subject: s.subjects?.name || 'Unknown',
          time: `${s.start_time?.slice(0, 5)} - ${s.end_time?.slice(0, 5)}`,
          faculty: 'TBA',
          classroom: s.classrooms?.name || 'TBA',
        })) || [];

        // Pending assignments formatted
        const pendingAssignmentsList = assignments?.map((a: any) => ({
          title: a.title,
          subject: a.subjects?.name || 'Unknown',
          dueDate: new Date(a.due_date).toLocaleDateString(),
        })) || [];

        // Notices formatted
        const recentNotices = notices?.map((n: any) => ({
          title: n.title,
          date: new Date(n.created_at).toLocaleDateString(),
          priority: n.priority,
        })) || [];

        // App status
        const appStatus = {
          pending: applications?.filter(a => a.status === 'submitted').length || 0,
          approved: applications?.filter(a => a.status === 'approved').length || 0,
          rejected: applications?.filter(a => a.status === 'rejected').length || 0,
        };

        setStats({
          studentInfo: {
            enrollment_no: student?.enrollment_no || 'N/A',
            section: student?.sections?.name || 'N/A',
            branch: student?.branches?.name || 'N/A',
            semester: student?.semesters?.number || 1,
          },
          attendancePercentage,
          pendingAssignments: assignments?.length || 0,
          totalSubjects: 6,
          upcomingExams: 2,
          applicationStatus: appStatus,
          todaySchedule,
          recentNotices,
          pendingAssignmentsList,
        });
      } else {
        // Demo data for new users without student record
        setStats({
          studentInfo: {
            enrollment_no: 'Not assigned',
            section: 'Not assigned',
            branch: 'Not assigned',
            semester: 1,
          },
          attendancePercentage: 85,
          pendingAssignments: 3,
          totalSubjects: 6,
          upcomingExams: 2,
          applicationStatus: { pending: 1, approved: 2, rejected: 0 },
          todaySchedule: [
            { subject: 'Database Management', time: '09:00 - 10:00', faculty: 'Dr. Smith', classroom: 'Room 101' },
            { subject: 'Software Engineering', time: '11:00 - 12:00', faculty: 'Dr. Johnson', classroom: 'Lab 201' },
            { subject: 'Web Development', time: '14:00 - 15:00', faculty: 'Dr. Williams', classroom: 'Lab 102' },
          ],
          recentNotices: [
            { title: 'Mid-term Examination Schedule Released', date: '2024-01-15', priority: 'high' },
            { title: 'Assignment Submission Deadline Extended', date: '2024-01-14', priority: 'normal' },
            { title: 'Workshop on AI/ML', date: '2024-01-13', priority: 'low' },
          ],
          pendingAssignmentsList: [
            { title: 'DBMS ER Diagram', subject: 'Database Management', dueDate: 'Jan 20, 2024' },
            { title: 'Use Case Document', subject: 'Software Engineering', dueDate: 'Jan 22, 2024' },
            { title: 'React Components', subject: 'Web Development', dueDate: 'Jan 25, 2024' },
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const attendanceData = [
    { name: 'Attendance', value: stats.attendancePercentage, fill: stats.attendancePercentage >= 75 ? '#22c55e' : '#ef4444' }
  ];

  const statCards = [
    {
      title: 'Attendance',
      value: `${stats.attendancePercentage}%`,
      icon: ClipboardList,
      color: stats.attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.attendancePercentage >= 75 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900',
      subtitle: stats.attendancePercentage >= 75 ? 'Good standing' : 'Below threshold',
    },
    {
      title: 'Pending Assignments',
      value: stats.pendingAssignments,
      icon: FileText,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900',
      subtitle: 'Due this week',
    },
    {
      title: 'Total Subjects',
      value: stats.totalSubjects,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      subtitle: 'This semester',
    },
    {
      title: 'Upcoming Exams',
      value: stats.upcomingExams,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      subtitle: 'Scheduled',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Student Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {stats.studentInfo?.branch} - Semester {stats.studentInfo?.semester} | Section {stats.studentInfo?.section}
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <Send className="h-4 w-4 mr-2" />
          New Application
        </Button>
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
              <p className="text-xs text-slate-400">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Schedule & Attendance Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Timetable
            </CardTitle>
            <CardDescription>Your class schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {stats.todaySchedule.map((lecture, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400 w-28">
                      {lecture.time}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{lecture.subject}</p>
                      <p className="text-sm text-slate-500">{lecture.faculty} | {lecture.classroom}</p>
                    </div>
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

        {/* Attendance Gauge */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Your attendance percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius="70%"
                  outerRadius="100%"
                  barSize={20}
                  data={attendanceData}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar
                    background={{ fill: '#e2e8f0' }}
                    cornerRadius={10}
                    dataKey="value"
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center mt-8">
                <div className="text-center">
                  <p className={`text-4xl font-bold ${stats.attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.attendancePercentage}%
                  </p>
                  <p className="text-sm text-slate-500">Overall</p>
                </div>
              </div>
            </div>
            {stats.attendancePercentage < 75 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg mt-4">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  Your attendance is below the required 75%. Please improve.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notices & Pending Assignments & Application Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Notices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Recent Notices
            </CardTitle>
            <CardDescription>Important announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentNotices.map((notice, i) => (
                <div key={i} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">{notice.title}</p>
                    <Badge variant={notice.priority === 'high' ? 'destructive' : notice.priority === 'normal' ? 'secondary' : 'outline'} className="ml-2 text-xs">
                      {notice.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{notice.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pending Assignments
            </CardTitle>
            <CardDescription>Upcoming deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.pendingAssignmentsList.map((assignment, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{assignment.title}</p>
                    <p className="text-sm text-slate-500">{assignment.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-amber-600 dark:text-amber-400">Due: {assignment.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Application Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Application Status
            </CardTitle>
            <CardDescription>Track your applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-900 dark:text-amber-100">Pending</span>
                </div>
                <span className="text-xl font-bold text-amber-600">{stats.applicationStatus.pending}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900 dark:text-green-100">Approved</span>
                </div>
                <span className="text-xl font-bold text-green-600">{stats.applicationStatus.approved}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-900 dark:text-red-100">Rejected</span>
                </div>
                <span className="text-xl font-bold text-red-600">{stats.applicationStatus.rejected}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
