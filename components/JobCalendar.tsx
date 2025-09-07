import React, { useState } from 'react';
import { useAuth, Job } from './AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users } from 'lucide-react';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  jobs: Job[];
}

export function JobCalendar() {
  const { jobs, users, user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter jobs based on user role
  const filteredJobs = user?.role === 'admin' 
    ? jobs 
    : jobs.filter(job => job.assignedCrew.includes(user?.id || ''));

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayJobs = filteredJobs.filter(job => {
        const jobStart = new Date(job.startDate);
        const jobEnd = new Date(job.endDate);
        return current >= jobStart && current <= jobEnd;
      });
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        jobs: dayJobs
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectTypeIcon = (type: Job['projectType']) => {
    switch (type) {
      case 'bathroom': return '🚿';
      case 'kitchen': return '🍳';
      case 'other': return '🔧';
      default: return '🔧';
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Job Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium min-w-[180px] text-center">
              {monthYear}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              className={`min-h-[120px] p-2 border rounded-lg ${
                day.isCurrentMonth 
                  ? 'bg-white border-gray-200' 
                  : 'bg-gray-50 border-gray-100'
              } ${
                day.date.toDateString() === new Date().toDateString()
                  ? 'ring-2 ring-blue-500'
                  : ''
              }`}
            >
              <div className={`text-sm mb-2 ${
                day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.date.getDate()}
              </div>
              
              <div className="space-y-1">
                {day.jobs.slice(0, 2).map(job => (
                  <div
                    key={job.id}
                    className={`text-xs p-1 rounded ${getStatusColor(job.status)} cursor-pointer hover:opacity-80 transition-opacity`}
                    title={`${job.title} - ${job.clientName}`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span>{getProjectTypeIcon(job.projectType)}</span>
                      <span className="truncate font-medium">{job.title}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs opacity-75">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{job.clientName}</span>
                    </div>
                    {user?.role === 'admin' && (
                      <div className="flex items-center gap-1 text-xs opacity-75">
                        <Users className="h-3 w-3" />
                        <span>{job.assignedCrew.length} crew</span>
                      </div>
                    )}
                  </div>
                ))}
                {day.jobs.length > 2 && (
                  <div className="text-xs text-gray-500 p-1">
                    +{day.jobs.length - 2} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-yellow-100 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-red-100 rounded"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}