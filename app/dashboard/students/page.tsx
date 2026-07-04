'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Plus, Edit2, Search, MoreHorizontal, Mail, Phone, Download, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Student {
  id: string;
  enrollment_no: string;
  roll_no: string;
  user_id: string;
  status: string;
  profiles?: { full_name: string; email: string } | null;
  sections?: { name: string } | null;
  branches?: { name: string } | null;
  semesters?: { number: number } | null;
}

interface Department {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
  department_id: string;
}

interface Semester {
  id: string;
  number: number;
  name: string;
}

interface Section {
  id: string;
  name: string;
  branch_id: string;
  semester_id: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    enrollment_no: '',
    roll_no: '',
    branch_id: '',
    semester_id: '',
    section_id: '',
  });

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
    fetchSemesters();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        enrollment_no,
        roll_no,
        user_id,
        status,
        sections (name),
        branches (name),
        semesters (number)
      `)
      .order('enrollment_no');

    if (error) {
      toast.error('Failed to fetch students');
    } else {
      // Fetch profiles separately
      const userIds = data?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const studentsWithProfiles = data?.map(s => ({
        ...s,
        profiles: profiles?.find(p => p.id === s.user_id) || null,
      })) || [];

      setStudents(studentsWithProfiles);
    }
    setLoading(false);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('id, name').order('name');
    setDepartments(data || []);
  };

  const fetchSemesters = async () => {
    const { data } = await supabase.from('semesters').select('id, number, name').order('number');
    setSemesters(data || []);
  };

  const fetchBranches = async (departmentId: string) => {
    const { data } = await supabase
      .from('branches')
      .select('id, name, department_id')
      .eq('department_id', departmentId);
    setBranches(data || []);
  };

  const fetchSections = async (branchId: string, semesterId: string) => {
    const { data } = await supabase
      .from('sections')
      .select('id, name, branch_id, semester_id')
      .eq('branch_id', branchId)
      .eq('semester_id', semesterId);
    setSections(data || []);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    // First create auth user
    const tempPassword = Math.random().toString(36).slice(-8);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: tempPassword,
    });

    if (authError) {
      toast.error('Failed to create user', { description: authError.message });
      return;
    }

    if (authData.user) {
      // Create profile
      await supabase.from('profiles').insert({
        id: authData.user.id,
        email: formData.email,
        full_name: formData.full_name,
        role: 'student',
      });

      // Create student record
      const { error: studentError } = await supabase.from('students').insert({
        user_id: authData.user.id,
        enrollment_no: formData.enrollment_no,
        roll_no: formData.roll_no,
        branch_id: formData.branch_id,
        semester_id: formData.semester_id,
        section_id: formData.section_id,
      });

      if (studentError) {
        toast.error('Failed to create student record', { description: studentError.message });
      } else {
        toast.success('Student added successfully', {
          description: `Temporary password: ${tempPassword}`
        });
        fetchStudents();
        setDialogOpen(false);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      enrollment_no: '',
      roll_no: '',
      branch_id: '',
      semester_id: '',
      section_id: '',
    });
    setBranches([]);
    setSections([]);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.enrollment_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      graduated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      dropped: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    };
    return colors[status] || colors.active;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Students
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage student records and enrollments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter student details to create a new enrollment.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStudent}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="enrollment">Enrollment No</Label>
                      <Input
                        id="enrollment"
                        value={formData.enrollment_no}
                        onChange={(e) => setFormData({ ...formData, enrollment_no: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roll">Roll No</Label>
                      <Input
                        id="roll"
                        value={formData.roll_no}
                        onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select onValueChange={(v) => { fetchBranches(v); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Semester</Label>
                      <Select onValueChange={(v) => setFormData({ ...formData, semester_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {semesters.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              Semester {s.number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <Select onValueChange={(v) => { setFormData({ ...formData, branch_id: v }); fetchSections(v, formData.semester_id); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Select onValueChange={(v) => setFormData({ ...formData, section_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            Section {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Add Student
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{students.length}</p>
                <p className="text-sm text-slate-500">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {students.filter(s => s.status === 'active').length}
                </p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Students</CardTitle>
              <CardDescription>Registered student records</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchQuery ? 'No students found matching your search.' : 'No students found. Add one to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Enrollment No</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              {student.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.profiles?.full_name || 'Unknown'}</p>
                            <p className="text-sm text-slate-500">{student.profiles?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{student.enrollment_no}</TableCell>
                      <TableCell>{(student.branches as any)?.name || '-'}</TableCell>
                      <TableCell>Sem {(student.semesters as any)?.number || '-'}</TableCell>
                      <TableCell>{(student.sections as any)?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(student.status)}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
