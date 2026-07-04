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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Megaphone, Plus, Eye, Pin, TrendingUp, AlertTriangle, Bell, Edit2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  expires_at: string | null;
  profiles?: { full_name: string } | null;
}

export default function NoticesPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
  });

  const isAdmin = profile?.role === 'admin';
  const isFaculty = profile?.role === 'faculty';

  useEffect(() => {
    fetchNotices();
  }, [profile]);

  const fetchNotices = async () => {
    setLoading(true);

    let query = supabase
      .from('notices')
      .select(`
        id,
        title,
        content,
        priority,
        is_published,
        published_at,
        created_at,
        expires_at,
        author_id,
        profiles (full_name)
      `)
      .order('created_at', { ascending: false });

    // For non-admin/faculty, only show published notices
    if (!isAdmin && !isFaculty) {
      query = query.eq('is_published', true);
    }

    const { data } = await query;
    setNotices(data || []);
    setLoading(false);
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('notices').insert({
      title: formData.title,
      content: formData.content,
      priority: formData.priority,
      author_id: profile?.id,
      is_published: true,
      published_at: new Date().toISOString(),
    });

    if (error) {
      toast.error('Failed to create notice', { description: error.message });
    } else {
      toast.success('Notice published successfully');
      fetchNotices();
      setDialogOpen(false);
      setFormData({ title: '', content: '', priority: 'normal' });
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('notices')
      .update({
        is_published: !currentStatus,
        published_at: !currentStatus ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update notice');
    } else {
      toast.success(currentStatus ? 'Notice unpublished' : 'Notice published');
      fetchNotices();
    }
  };

  const deleteNotice = async (id: string) => {
    const { error } = await supabase.from('notices').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete notice');
    } else {
      toast.success('Notice deleted');
      fetchNotices();
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      low: { color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200', icon: null },
      normal: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: null },
      high: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', icon: <TrendingUp className="h-3 w-3" /> },
      urgent: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: <AlertTriangle className="h-3 w-3" /> },
    };
    return config[priority] || config.normal;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Notice Board
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isAdmin || isFaculty ? 'Manage and publish notices' : 'View official announcements'}
          </p>
        </div>
        {(isAdmin || isFaculty) && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              New Notice
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Notice</DialogTitle>
                <DialogDescription>
                  Publish a new notice for students and faculty
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateNotice}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="Notice title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      placeholder="Write the notice content..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={6}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Publish Notice
                  </Button>
                </DialogFooter>
              </form>
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
                <Pin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {notices.filter(n => n.is_published).length}
                </p>
                <p className="text-sm text-slate-500">Published Notices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {notices.filter(n => n.priority === 'urgent').length}
                </p>
                <p className="text-sm text-slate-500">Urgent Notices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {notices.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-slate-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No notices available</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          notices.map((notice) => {
            const priorityConfig = getPriorityBadge(notice.priority);
            return (
              <Card key={notice.id} className={`overflow-hidden ${!notice.is_published ? 'opacity-60' : ''}`}>
                <div className={`h-1 ${notice.priority === 'urgent' ? 'bg-red-500' : notice.priority === 'high' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!notice.is_published && (
                          <Badge variant="outline">Draft</Badge>
                        )}
                        <Badge className={priorityConfig.color}>
                          {priorityConfig.icon}
                          <span className="ml-1 capitalize">{notice.priority}</span>
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{notice.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(notice.published_at || notice.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {notice.profiles?.full_name && (
                          <span>| By {notice.profiles.full_name}</span>
                        )}
                      </CardDescription>
                    </div>
                    {(isAdmin || isFaculty) && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePublish(notice.id, notice.is_published)}
                        >
                          {notice.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteNotice(notice.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                    {notice.content}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
