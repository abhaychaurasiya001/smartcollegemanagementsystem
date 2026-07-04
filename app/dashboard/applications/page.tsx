'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, FileText, Loader2, Wand2, CheckCircle, Clock, XCircle, Eye, RefreshCw, Edit2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Faculty {
  id: string;
  employee_id: string;
  profiles?: { full_name: string } | null;
}

interface Subject {
  id: string;
  code: string;
  name: string;
}

interface StudentInfo {
  id: string;
  enrollment_no: string;
  branch_id: string;
  semester_id: string;
}

interface Application {
  id: string;
  application_type: string;
  original_reason: string;
  generated_content: string;
  status: string;
  faculty_comments: string | null;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  faculty?: { profiles?: { full_name: string } } | null;
  subjects?: { name: string } | null;
}

const applicationTypes = [
  { value: 'leave_request', label: 'Leave Request' },
  { value: 'assignment_extension', label: 'Assignment Extension' },
  { value: 'project_approval', label: 'Project Approval' },
  { value: 'internship_permission', label: 'Internship Permission' },
  { value: 'bonafide_certificate', label: 'Bonafide Certificate' },
  { value: 'scholarship_request', label: 'Scholarship Request' },
  { value: 'exam_rejoin', label: 'Exam Rejoin' },
  { value: 'attendance_regularization', label: 'Attendance Regularization' },
  { value: 'general_request', label: 'General Request' },
];

export default function ApplicationsPage() {
  const { profile } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [generatedContent, setGeneratedContent] = useState('');
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);

  const [formData, setFormData] = useState({
    faculty_id: '',
    application_type: '',
    subject_id: '',
    reason: '',
  });

  useEffect(() => {
    if (profile) {
      fetchStudentInfo();
      fetchFaculty();
      fetchSubjects();
      fetchApplications();
    }
  }, [profile]);

  const fetchStudentInfo = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('students')
      .select('id, enrollment_no, branch_id, semester_id')
      .eq('user_id', profile.id)
      .maybeSingle();
    if (data) setStudentInfo(data);
  };

  const fetchFaculty = async () => {
    const { data } = await supabase
      .from('faculty')
      .select('id, employee_id, profiles!faculty_user_id_fkey (full_name)')
      .eq('status', 'active');
    if (data) {
      const facultyData = data.map((f: any) => ({
        id: f.id,
        employee_id: f.employee_id,
        profiles: f.profiles?.[0] || f.profiles,
      }));
      setFaculty(facultyData);
    }
  };

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('id, code, name')
      .order('name');
    setSubjects(data || []);
  };

  const fetchApplications = async () => {
    if (!profile) return;

    const { data: studentData } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (studentData) {
      const { data } = await supabase
        .from('applications')
        .select(`
          id,
          application_type,
          original_reason,
          generated_content,
          status,
          faculty_comments,
          created_at,
          submitted_at,
          reviewed_at,
          faculty (
            profiles (full_name)
          ),
          subjects (name)
        `)
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false });
      if (data) {
        const formattedApps = data.map((app: any) => ({
          ...app,
          faculty: Array.isArray(app.faculty) ? app.faculty[0] : app.faculty,
          subjects: Array.isArray(app.subjects) ? app.subjects[0] : app.subjects,
        }));
        setApplications(formattedApps);
      }
    }
  };

  const generateApplication = async () => {
    if (!formData.reason.trim()) {
      toast.error('Please enter a reason for your application');
      return;
    }

    if (!formData.application_type) {
      toast.error('Please select an application type');
      return;
    }

    if (!formData.faculty_id) {
      toast.error('Please select a faculty member');
      return;
    }

    setGenerating(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          studentName: profile?.full_name,
          enrollmentNo: studentInfo?.enrollment_no || 'N/A',
          department: 'Computer Science', // Could fetch from student record
          semester: '6', // Could fetch from student record
          professor: faculty.find(f => f.id === formData.faculty_id)?.profiles?.full_name || 'Professor',
          applicationType: formData.application_type,
          subject: subjects.find(s => s.id === formData.subject_id)?.name || '',
          reason: formData.reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate application');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      toast.success('Application generated successfully!');
    } catch (error) {
      toast.error('Failed to generate application');
    } finally {
      setGenerating(false);
    }
  };

  const saveApplication = async (status: 'draft' | 'submitted') => {
    if (!generatedContent || !studentInfo || !formData.faculty_id) return;

    setLoading(true);

    const applicationData = {
      student_id: studentInfo.id,
      faculty_id: formData.faculty_id,
      subject_id: formData.subject_id || null,
      application_type: formData.application_type,
      original_reason: formData.reason,
      generated_content: generatedContent,
      status,
      submitted_at: status === 'submitted' ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from('applications').insert(applicationData);

    if (error) {
      toast.error('Failed to save application', { description: error.message });
    } else {
      toast.success(status === 'submitted' ? 'Application submitted successfully!' : 'Draft saved successfully!');
      fetchApplications();
      setCreateDialogOpen(false);
      resetForm();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      faculty_id: '',
      application_type: '',
      subject_id: '',
      reason: '',
    });
    setGeneratedContent('');
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      draft: { color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200', icon: <Edit2 className="h-3 w-3" /> },
      submitted: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: <Clock className="h-3 w-3" /> },
      viewed: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', icon: <Eye className="h-3 w-3" /> },
      approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: <XCircle className="h-3 w-3" /> },
    };
    return config[status] || config.draft;
  };

  const isFaculty = profile?.role === 'faculty';

  // For faculty view
  const [facultyApplications, setFacultyApplications] = useState<any[]>([]);

  useEffect(() => {
    if (isFaculty && profile) {
      fetchFacultyApplications();
    }
  }, [profile, isFaculty]);

  const fetchFacultyApplications = async () => {
    if (!profile) return;

    const { data: facultyData } = await supabase
      .from('faculty')
      .select('id')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (facultyData) {
      const { data } = await supabase
        .from('applications')
        .select(`
          id,
          application_type,
          generated_content,
          status,
          faculty_comments,
          created_at,
          submitted_at,
          students (
            profiles (full_name),
            enrollment_no
          ),
          subjects (name)
        `)
        .eq('faculty_id', facultyData.id)
        .neq('status', 'draft')
        .order('submitted_at', { ascending: false });
      setFacultyApplications(data || []);
    }
  };

  const updateApplicationStatus = async (id: string, status: string, comments?: string) => {
    const { error } = await supabase
      .from('applications')
      .update({
        status,
        faculty_comments: comments || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update application');
    } else {
      toast.success(`Application ${status}`);
      fetchFacultyApplications();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Applications
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isFaculty ? 'Review and manage student applications' : 'Create and track your applications'}
          </p>
        </div>
        {!isFaculty && (
          <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetForm(); }}>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Wand2 className="h-4 w-4 mr-2" />
              AI Generate Application
            </Button>
            <DialogContent className="max-w-4xl h-[85vh]">
              <DialogHeader>
                <DialogTitle>Generate Application</DialogTitle>
                <DialogDescription>
                  Enter your reason and let AI create a professional application for you
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6 h-full">
                {/* Input Side */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Application Type</Label>
                    <Select value={formData.application_type} onValueChange={(v) => setFormData({ ...formData, application_type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select application type" />
                      </SelectTrigger>
                      <SelectContent>
                        {applicationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Professor</Label>
                    <Select value={formData.faculty_id} onValueChange={(v) => setFormData({ ...formData, faculty_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculty.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.profiles?.full_name || 'Unknown'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject (Optional)</Label>
                    <Select value={formData.subject_id} onValueChange={(v) => setFormData({ ...formData, subject_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason for Application</Label>
                    <Textarea
                      placeholder="e.g., I had a fever yesterday and missed the DBMS class..."
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-slate-500">
                      Write in simple language - AI will convert it to a professional format
                    </p>
                  </div>
                  <Button
                    onClick={generateApplication}
                    disabled={generating}
                    variant="outline"
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate Application
                      </>
                    )}
                  </Button>
                </div>

                {/* Preview Side */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Generated Application</Label>
                    {generatedContent && (
                      <Button variant="ghost" size="sm" onClick={generateApplication}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Regenerate
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="flex-1 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
                    {generatedContent ? (
                      <pre className="whitespace-pre-wrap text-sm font-sans">{generatedContent}</pre>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        Generated application will appear here
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
              <DialogFooter className="justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => saveApplication('draft')}
                  disabled={!generatedContent || loading}
                >
                  Save as Draft
                </Button>
                <Button
                  onClick={() => saveApplication('submitted')}
                  disabled={!generatedContent || loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isFaculty ? facultyApplications.length : applications.length}
                </p>
                <p className="text-sm text-slate-500">Total Applications</p>
              </div>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isFaculty
                    ? facultyApplications.filter(a => a.status === 'approved').length
                    : applications.filter(a => a.status === 'approved').length}
                </p>
                <p className="text-sm text-slate-500">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isFaculty
                    ? facultyApplications.filter(a => a.status === 'submitted' || a.status === 'viewed').length
                    : applications.filter(a => a.status === 'submitted' || a.status === 'viewed').length}
                </p>
                <p className="text-sm text-slate-500">Pending</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isFaculty
                    ? facultyApplications.filter(a => a.status === 'rejected').length
                    : applications.filter(a => a.status === 'rejected').length}
                </p>
                <p className="text-sm text-slate-500">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isFaculty ? 'Student Applications' : 'My Applications'}
          </CardTitle>
          <CardDescription>
            {isFaculty ? 'Review and respond to student applications' : 'Track your submitted applications'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(isFaculty ? facultyApplications : applications).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No applications found
            </div>
          ) : (
            <div className="space-y-4">
              {(isFaculty ? facultyApplications : applications).map((app: any) => {
                const statusConfig = getStatusBadge(app.status);
                return (
                  <div key={app.id} className="border rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={statusConfig.color}>
                            {statusConfig.icon}
                            <span className="ml-1 capitalize">{app.status}</span>
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {applicationTypes.find(t => t.value === app.application_type)?.label || app.application_type}
                          </span>
                        </div>
                        <p className="font-medium">
                          {isFaculty
                            ? `From: ${app.students?.profiles?.full_name || 'Unknown'}`
                            : `To: ${app.faculty?.profiles?.full_name || 'Professor'}`}
                        </p>
                        <p className="text-sm text-slate-500">
                          {app.subjects?.name && `Subject: ${app.subjects.name}`}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(app.submitted_at || app.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingApplication(app)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                              <DialogDescription>
                                {isFaculty
                                  ? `From: ${app.students?.profiles?.full_name}`
                                  : `To: ${app.faculty?.profiles?.full_name}`}
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-[50vh]">
                              <pre className="whitespace-pre-wrap text-sm font-sans p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                {app.generated_content}
                              </pre>
                            </ScrollArea>
                            {isFaculty && (app.status === 'submitted' || app.status === 'viewed') && (
                              <DialogFooter className="gap-2">
                                <Button
                                  variant="destructive"
                                  onClick={() => updateApplicationStatus(app.id, 'rejected', 'Rejected by faculty')}
                                >
                                  Reject
                                </Button>
                                <Button
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => updateApplicationStatus(app.id, 'approved', 'Approved')}
                                >
                                  Approve
                                </Button>
                              </DialogFooter>
                            )}
                            {app.faculty_comments && (
                              <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <p className="text-sm font-medium mb-1">Faculty Comments:</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{app.faculty_comments}</p>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {isFaculty && (app.status === 'submitted' || app.status === 'viewed') && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateApplicationStatus(app.id, 'approved', 'Approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateApplicationStatus(app.id, 'rejected', 'Rejected by faculty')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
