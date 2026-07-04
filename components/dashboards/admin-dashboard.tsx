'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users, GraduationCap, Building2, Calendar, FileText, Bell,
  Clock, BookOpen, ClipboardList, Send, AlertCircle, CheckCircle,
  Activity, TrendingUp, UserCheck, UserX, Briefcase, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface DashboardStats {
  totalStudents: number;
  totalFaculty: number;
  totalDepartments: number;
  totalSubjects: number;
  pendingApplications: number;
  attendanceRate: number;
  todayClasses: number;
  activeStudents: number;
  departmentStats: { name: string; students: number; faculty: number }[];
  applicationStats: { status: string; count: number }[];
  attendanceStats: { date: string; present: number; absent: number }[];
  recentActivities: { id: string; type: string; message: string; time: string }[];
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    totalSubjects: 0,
    pendingApplications: 0,
    attendanceRate: 85,
    todayClasses: 0,
    activeStudents: 0,
    departmentStats: [],
    applicationStats: [],
    attendanceStats: [],
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch basic counts
      const [studentsResult, facultyResult, departmentsResult, subjectsResult, applicationsResult] =
        await Promise.all([
          supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('faculty').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('departments').select('id', { count: 'exact', head: true }),
          supabase.from('subjects').select('id', { count: 'exact', head: true }),
          supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        ]);

      // Get today's classes
      const today = new Date().getDay();
      const { count: todayClassesCount } = await supabase
        .from('timetables')
        .select('id', { count: 'exact', head: true })
        .eq('day_of_week', today)
        .eq('is_active', true);

      // Get department stats
      const { data: departments } = await supabase.from('departments').select('id, name');
      const departmentStats = [];
      if (departments) {
        for (const dept of departments) {
          const { count: studentCount } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('department_id', dept.id);
          const { data: facultyInDept } = await supabase
            .from('faculty')
            .select('id')
            .eq('department_id', dept.id);
          departmentStats.push({
            name: dept.name,
            students: studentCount || 0,
            faculty: facultyInDept?.length || 0,
          });
        }
      }

      // Get application stats
      const { data: appStats } = await supabase
        .from('applications')
        .select('status');

      const applicationStats = [
        { status: 'submitted', count: appStats?.filter(a => a.status === 'submitted').length || 0 },
        { status: 'approved', count: appStats?.filter(a => a.status === 'approved').length || 0 },
        { status: 'rejected', count: appStats?.filter(a => a.status === 'rejected').length || 0 },
        { status: 'pending', count: appStats?.filter(a => a.status === 'draft').length || 0 },
      ];

      // Generate attendance stats (last 7 days)
      const attendanceStats = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        // Simulated data for demo
        const present = Math.floor(Math.random() * 200) + 180;
        const absent = 230 - present;
        attendanceStats.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          present,
          absent,
        });
      }

      // Recent activities (simulated)
      const recentActivities = [
        { id: '1', type: 'student', message: 'New student John Doe registered', time: '2 min ago' },
        { id: '2', type: 'application', message: 'Application approved for leave request', time: '15 min ago' },
        { id: '3', type: 'attendance', message: 'Attendance marked for CS-101', time: '1 hour ago' },
        { id: '4', type: 'notice', message: 'New notice published - Holiday Announcement', time: '2 hours ago' },
        { id: '5', type: 'assignment', message: 'New assignment created for DBMS', time: '3 hours ago' },
      ];

      setStats({
        totalStudents: studentsResult.count || 0,
        totalFaculty: facultyResult.count || 0,
        totalDepartments: departmentsResult.count || 0,
        totalSubjects: subjectsResult.count || 0,
        pendingApplications: applicationsResult.count || 0,
        attendanceRate: 85,
        todayClasses: todayClassesCount || 0,
        activeStudents: studentsResult.count || 0,
        departmentStats,
        applicationStats,
        attendanceStats,
        recentActivities,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Total Faculty',
      value: stats.totalFaculty,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
      change: '+5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Departments',
      value: stats.totalDepartments,
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      change: '0%',
      changeType: 'neutral' as const,
    },
    {
      title: "Today's Classes",
      value: stats.todayClasses,
      icon: Calendar,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900',
      change: '',
      changeType: 'neutral' as const,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Overview of your institution's academic operations
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {stat.change && (
                  <Badge variant={stat.changeType === 'positive' ? 'default' : 'secondary'}
                    className={stat.changeType === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}>
                    {stat.change}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
            <CardDescription>Students and faculty by department</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.departmentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#3b82f6" name="Students" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="faculty" fill="#22c55e" name="Faculty" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                No department data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Distribution of student applications</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.applicationStats.filter(s => s.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                >
                  {stats.applicationStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Trend & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Attendance Trend</CardTitle>
            <CardDescription>Daily attendance overview for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.attendanceStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#22c55e" name="Present" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" name="Absent" strokeWidth={2} dot={{ fill: '#ef4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivities.map((activity, i) => {
                const icons = {
                  student: Users,
                  application: Send,
                  attendance: ClipboardList,
                  notice: Bell,
                  assignment: FileText,
                };
                const Icon = icons[activity.type as keyof typeof icons] || Activity;
                const colors = {
                  student: 'text-blue-500 bg-blue-100 dark:bg-blue-900',
                  application: 'text-green-500 bg-green-100 dark:bg-green-900',
                  attendance: 'text-amber-500 bg-amber-100 dark:bg-amber-900',
                  notice: 'text-purple-500 bg-purple-100 dark:bg-purple-900',
                  assignment: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900',
                };
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colors[activity.type as keyof typeof colors] || 'text-slate-500 bg-slate-100'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 dark:text-slate-100 truncate">{activity.message}</p>
                      <p className="text-xs text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Actions</CardTitle>
          <CardDescription>Items requiring your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Pending Applications</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">{stats.pendingApplications} awaiting review</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <UserX className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">Low Attendance</p>
                <p className="text-sm text-red-600 dark:text-red-400">15 students below 75%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Unpublished Results</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">3 pending publication</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
