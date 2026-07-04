'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardList, Calendar, Save, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  roll_no: string;
  profiles?: { full_name: string } | null;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface FacultySubject {
  subject_id: string;
  section_id: string;
  subjects?: { id: string; name: string; code: string } | null;
  sections?: { id: string; name: string } | null;
}

export default function AttendancePage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [attendanceStats, setAttendanceStats] = useState<any[]>([]);

  const isFaculty = profile?.role === 'faculty';

  useEffect(() => {
    if (isFaculty) {
      fetchFacultySubjects();
    } else {
      fetchStudentAttendance();
    }
  }, [profile]);

  const fetchFacultySubjects = async () => {
    if (!profile) return;

    const { data: facultyData } = await supabase
      .from('faculty')
      .select('id')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (facultyData) {
      const { data } = await supabase
        .from('faculty_subjects')
        .select(`
          subject_id,
          section_id,
          subjects (id, name, code),
          sections (id, name)
        `)
        .eq('faculty_id', facultyData.id);

      setSubjects(data || []);
    }
    setLoading(false);
  };

  const fetchStudents = async (sectionId: string) => {
    const { data } = await supabase
      .from('students')
      .select('id, roll_no, profiles (full_name)')
      .eq('section_id', sectionId)
      .eq('status', 'active')
      .order('roll_no');

    // Initialize attendance state
    const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
    data?.forEach((s) => {
      initialAttendance[s.id] = 'present';
    });

    setStudents(data || []);
    setAttendance(initialAttendance);
  };

  const fetchStudentAttendance = async () => {
    if (!profile) return;

    const { data: studentData } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (studentData) {
      const { data } = await supabase
        .from('attendance')
        .select(`
          id,
          date,
          status,
          subjects (id, name, code)
        `)
        .eq('student_id', studentData.id)
        .order('date', { ascending: false })
        .limit(30);

      // Calculate stats
      setAttendanceStats(data || []);
    }
    setLoading(false);
  };

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
    if (!selectedSubject || !selectedSection) {
      toast.error('Please select subject and section');
      return;
    }

    setSaving(true);

    const facultyId = await getFacultyId();
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: studentId,
      subject_id: selectedSubject,
      faculty_id: facultyId,
      date: selectedDate.toISOString().split('T')[0],
      status,
    }));

    // Delete existing records for this date and insert new
    const { error: deleteError } = await supabase
      .from('attendance')
      .delete()
      .eq('subject_id', selectedSubject)
      .eq('date', selectedDate.toISOString().split('T')[0]);

    if (deleteError) {
      toast.error('Failed to clear existing attendance');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('attendance').insert(records);

    if (error) {
      toast.error('Failed to save attendance', { description: error.message });
    } else {
      toast.success('Attendance saved successfully');
    }
    setSaving(false);
  };

  const getFacultyId = async () => {
    if (!profile) return null;

    const { data } = await supabase
      .from('faculty')
      .select('id')
      .eq('user_id', profile.id)
      .maybeSingle();

    return data?.id || null;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string }> = {
      present: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      absent: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      late: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
      excused: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    };
    return config[status] || config.present;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Student View
  if (!isFaculty) {
    const totalClasses = attendanceStats.length;
    const present = attendanceStats.filter(a => a.status === 'present').length;
    const absent = attendanceStats.filter(a => a.status === 'absent').length;
    const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Attendance
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              View your attendance records
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className={`text-4xl font-bold ${percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                  {percentage}%
                </p>
                <p className="text-sm text-slate-500">Overall Attendance</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{present}</p>
                  <p className="text-sm text-slate-500">Present</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{absent}</p>
                  <p className="text-sm text-slate-500">Absent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalClasses}</p>
                  <p className="text-sm text-slate-500">Total Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {percentage < 75 && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">Low Attendance Warning</p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Your attendance is below the required 75%. Please attend classes regularly to avoid academic consequences.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Your attendance record for the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceStats.slice(0, 15).map((record, i) => (
                    <TableRow key={i}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.subjects?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(record.status).color}>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Faculty View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Mark Attendance
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Mark attendance for your classes
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Date</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select
                value={selectedSubject}
                onValueChange={(v) => {
                  setSelectedSubject(v);
                  const sub = subjects.find(s => s.subject_id === v);
                  if (sub?.section_id) {
                    setSelectedSection(sub.section_id);
                    fetchStudents(sub.section_id);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.subject_id} value={s.subject_id || ''}>
                      {(s.subjects as any)?.name} - Section {(s.sections as any)?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      {students.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>{students.length} students enrolled</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const newAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
                students.forEach(s => newAttendance[s.id] = 'present');
                setAttendance(newAttendance);
              }}>
                Mark All Present
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const newAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
                students.forEach(s => newAttendance[s.id] = 'absent');
                setAttendance(newAttendance);
              }}>
                Mark All Absent
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono">{student.roll_no}</TableCell>
                      <TableCell>{student.profiles?.full_name || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(student.id, 'present')}
                            className={attendance[student.id] === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            P
                          </Button>
                          <Button
                            size="sm"
                            variant={attendance[student.id] === 'absent' ? 'destructive' : 'outline'}
                            onClick={() => handleAttendanceChange(student.id, 'absent')}
                          >
                            A
                          </Button>
                          <Button
                            size="sm"
                            variant={attendance[student.id] === 'late' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(student.id, 'late')}
                            className={attendance[student.id] === 'late' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                          >
                            L
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveAttendance} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Attendance
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
