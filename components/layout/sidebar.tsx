'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  Building2,
  School,
  ClipboardList,
  BarChart3,
  Megaphone,
  Briefcase,
  Trophy,
  MessageSquare,
  Clock,
  Send,
  FolderOpen,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const adminNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { title: 'Departments', href: '/dashboard/departments', icon: <Building2 className="h-4 w-4" /> },
  { title: 'Branches', href: '/dashboard/branches', icon: <GraduationCap className="h-4 w-4" /> },
  { title: 'Semesters & Sections', href: '/dashboard/academics', icon: <School className="h-4 w-4" /> },
  { title: 'Subjects', href: '/dashboard/subjects', icon: <BookOpen className="h-4 w-4" /> },
  { title: 'Classrooms', href: '/dashboard/classrooms', icon: <School className="h-4 w-4" /> },
  { title: 'Students', href: '/dashboard/students', icon: <Users className="h-4 w-4" /> },
  { title: 'Faculty', href: '/dashboard/faculty', icon: <Briefcase className="h-4 w-4" /> },
  { title: 'Faculty Assignment', href: '/dashboard/faculty/assign', icon: <ClipboardList className="h-4 w-4" /> },
  { title: 'Timetables', href: '/dashboard/timetables', icon: <Calendar className="h-4 w-4" /> },
  { title: 'Notices', href: '/dashboard/notices', icon: <Megaphone className="h-4 w-4" /> },
  { title: 'Events', href: '/dashboard/events', icon: <Trophy className="h-4 w-4" /> },
  { title: 'Reports', href: '/dashboard/reports', icon: <BarChart3 className="h-4 w-4" /> },
  { title: 'Settings', href: '/dashboard/settings', icon: <Settings className="h-4 w-4" /> },
];

const facultyNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { title: 'My Subjects', href: '/dashboard/my-subjects', icon: <BookOpen className="h-4 w-4" /> },
  { title: 'Timetable', href: '/dashboard/timetable', icon: <Calendar className="h-4 w-4" /> },
  { title: 'Attendance', href: '/dashboard/attendance', icon: <ClipboardList className="h-4 w-4" /> },
  { title: 'Study Materials', href: '/dashboard/materials', icon: <FolderOpen className="h-4 w-4" /> },
  { title: 'Assignments', href: '/dashboard/assignments', icon: <FileText className="h-4 w-4" /> },
  { title: 'Marks Entry', href: '/dashboard/marks', icon: <BarChart3 className="h-4 w-4" /> },
  { title: 'Applications', href: '/dashboard/applications', icon: <Send className="h-4 w-4" /> },
  { title: 'Students', href: '/dashboard/students', icon: <Users className="h-4 w-4" /> },
  { title: 'Notices', href: '/dashboard/notices', icon: <Megaphone className="h-4 w-4" /> },
  { title: 'Profile', href: '/dashboard/profile', icon: <Settings className="h-4 w-4" /> },
];

const studentNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { title: 'My Profile', href: '/dashboard/profile', icon: <UserSquare className="h-4 w-4" /> },
  { title: 'Timetable', href: '/dashboard/timetable', icon: <Calendar className="h-4 w-4" /> },
  { title: 'Attendance', href: '/dashboard/attendance', icon: <ClipboardList className="h-4 w-4" /> },
  { title: 'Marks', href: '/dashboard/marks', icon: <BarChart3 className="h-4 w-4" /> },
  { title: 'Study Materials', href: '/dashboard/materials', icon: <FolderOpen className="h-4 w-4" /> },
  { title: 'Assignments', href: '/dashboard/assignments', icon: <FileText className="h-4 w-4" /> },
  { title: 'Applications', href: '/dashboard/applications', icon: <Send className="h-4 w-4" /> },
  { title: 'Notices', href: '/dashboard/notices', icon: <Megaphone className="h-4 w-4" /> },
  { title: 'Events', href: '/dashboard/events', icon: <Trophy className="h-4 w-4" /> },
];

function UserSquare({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case 'admin':
      return adminNavItems;
    case 'faculty':
      return facultyNavItems;
    case 'student':
      return studentNavItems;
    default:
      return studentNavItems;
  }
}

function SidebarContent({ className }: { className?: string }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const navItems = getNavItems(profile?.role || 'student');

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-slate-100">Smart College</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{profile?.role} Portal</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive && 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium'
                  )}
                >
                  {item.icon}
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
              {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
              {profile?.full_name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {profile?.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <SidebarContent className="h-screen sticky top-0" />
      </aside>
    </>
  );
}
