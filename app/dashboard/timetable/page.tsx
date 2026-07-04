'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, MapPin, Loader2, User } from 'lucide-react';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
  '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
];

interface TimetableEntry {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subjects?: { name: string; code: string } | null;
  faculty?: { profiles?: { full_name: string } } | null;
  classrooms?: { name: string } | null;
  sections?: { name: string } | null;
}

export default function TimetablePage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay().toString());

  useEffect(() => {
    fetchTimetable();
  }, [profile, selectedDay]);

  const fetchTimetable = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      let query = supabase
        .from('timetables')
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          subjects (name, code),
          faculty (
            profiles (full_name)
          ),
          classrooms (name),
          sections (name)
        `)
        .eq('is_active', true);

      if (profile.role === 'student') {
        // Get student's section
        const { data: student } = await supabase
          .from('students')
          .select('section_id')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (student?.section_id) {
          query = query.eq('section_id', student.section_id);
        }
      } else if (profile.role === 'faculty') {
        // Get faculty's classes
        const { data: faculty } = await supabase
          .from('faculty')
          .select('id')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (faculty?.id) {
          query = query.eq('faculty_id', faculty.id);
        }
      }

      const { data } = await query.order('day_of_week').order('start_time');
      setTimetable(data || []);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    }

    setLoading(false);
  };

  const getClassesForSlot = (day: number, time: string) => {
    const [start] = time.split('-');
    return timetable.filter(
      (t) => t.day_of_week === day && t.start_time?.startsWith(start)
    );
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Timetable
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {profile?.role === 'faculty'
              ? 'Your teaching schedule'
              : 'Your weekly class schedule'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {days.map((day, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Today's Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {days[parseInt(selectedDay)]}'s Schedule
          </CardTitle>
          <CardDescription>
            {timetable.filter(t => t.day_of_week === parseInt(selectedDay)).length || 0} classes scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const dayClasses = timetable.filter(t => t.day_of_week === parseInt(selectedDay));
            if (dayClasses.length === 0) {
              return (
                <div className="text-center py-8 text-slate-500">
                  No classes scheduled for {days[parseInt(selectedDay)]}
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {dayClasses
                  .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                  .map((cls, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 w-32">
                        <Clock className="h-4 w-4" />
                        {cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {(cls.subjects as any)?.name || 'Unknown Subject'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          {cls.classrooms && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {(cls.classrooms as any)?.name}
                            </span>
                          )}
                          {cls.faculty && (cls.faculty as any)?.profiles?.full_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {(cls.faculty as any)?.profiles?.full_name}
                            </span>
                          )}
                          {cls.sections && (cls.sections as any)?.name && (
                            <span className="flex items-center gap-1">
                              Section {(cls.sections as any)?.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {profile?.role === 'faculty' && (
                        <Button size="sm" variant="outline">
                          Attendance
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
          <CardDescription>All classes for the week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border bg-slate-50 dark:bg-slate-800">Time</th>
                  {days.slice(1, 6).map((day, i) => (
                    <th key={i} className="p-2 border bg-slate-50 dark:bg-slate-800 min-w-[150px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="p-2 border text-sm font-medium bg-slate-50 dark:bg-slate-800">
                      {time.split('-')[0]}
                    </td>
                    {days.slice(1, 6).map((_, dayIndex) => {
                      const classes = getClassesForSlot(dayIndex + 1, time);
                      return (
                        <td key={dayIndex} className="p-1 border">
                          {classes.map((cls, i) => (
                            <div
                              key={i}
                              className="p-2 mb-1 rounded bg-blue-50 dark:bg-blue-950 text-xs"
                            >
                              <p className="font-medium text-blue-700 dark:text-blue-300">
                                {(cls.subjects as any)?.name || 'Subject'}
                              </p>
                              <p className="text-slate-500">
                                {(cls.classrooms as any)?.name || 'TBA'}
                              </p>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
