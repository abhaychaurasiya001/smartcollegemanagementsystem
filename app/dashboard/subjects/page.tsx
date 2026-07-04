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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Plus, Search, Award, MoreHorizontal, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  type: string;
  hours_per_week: number;
  departments?: { name: string } | null;
  semesters?: { number: number } | null;
}

interface Department {
  id: string;
  name: string;
}

interface Semester {
  id: string;
  number: number;
  name: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    credits: '3',
    type: 'theory',
    hours_per_week: '4',
    department_id: '',
    semester_id: '',
  });

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
    fetchSemesters();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        id,
        code,
        name,
        credits,
        type,
        hours_per_week,
        departments (name),
        semesters (number)
      `)
      .order('name');

    if (error) {
      toast.error('Failed to fetch subjects');
    } else {
      setSubjects(data || []);
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

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('subjects').insert({
      code: formData.code.toUpperCase(),
      name: formData.name,
      credits: parseInt(formData.credits),
      type: formData.type,
      hours_per_week: parseInt(formData.hours_per_week),
      department_id: formData.department_id || null,
      semester_id: formData.semester_id || null,
    });

    if (error) {
      toast.error('Failed to add subject', { description: error.message });
    } else {
      toast.success('Subject added successfully');
      fetchSubjects();
      setDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      credits: '3',
      type: 'theory',
      hours_per_week: '4',
      department_id: '',
      semester_id: '',
    });
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      theory: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      lab: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      practical: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      project: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return colors[type] || colors.theory;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Subjects
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage course subjects and curriculum
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>
                Enter subject details to add to the curriculum.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubject}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Subject Code</Label>
                    <Input
                      id="code"
                      placeholder="CS101"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="1"
                      max="6"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    placeholder="Database Management Systems"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="theory">Theory</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                        <SelectItem value="practical">Practical</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hours/Week</Label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.hours_per_week}
                      onChange={(e) => setFormData({ ...formData, hours_per_week: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select onValueChange={(v) => setFormData({ ...formData, department_id: v })}>
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
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select onValueChange={(v) => setFormData({ ...formData, semester_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
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
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Add Subject
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{subjects.length}</p>
                <p className="text-sm text-slate-500">Total Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Subjects</CardTitle>
              <CardDescription>Course subjects in the curriculum</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search subjects..."
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No subjects found. Add one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {subject.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>{(subject.departments as any)?.name || '-'}</TableCell>
                      <TableCell>Sem {(subject.semesters as any)?.number || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          <Award className="h-3 w-3 mr-1" />
                          {subject.credits}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeBadge(subject.type)}>
                          {subject.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{subject.hours_per_week} hrs</TableCell>
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
