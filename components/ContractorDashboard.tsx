import React, { useState } from 'react';
import { useAuth, Job } from './AuthProvider';
import { JobCalendar } from './JobCalendar';
import { CommunicationForm } from './CommunicationForm';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Calendar, 
  MapPin, 
  Clock,
  Briefcase,
  CheckCircle,
  AlertCircle,
  User,
  MessageSquare,
  Send
} from 'lucide-react';

export function ContractorDashboard() {
  const { jobs, users, user, communications } = useAuth();
  const [selectedJobForComm, setSelectedJobForComm] = useState<Job | null>(null);

  // Filter jobs for the current contractor
  const contractorJobs = jobs.filter(job => job.assignedCrew.includes(user?.id || ''));
  const activeJobs = contractorJobs.filter(job => job.status === 'in_progress' || job.status === 'scheduled');
  const completedJobs = contractorJobs.filter(job => job.status === 'completed');
  const todayJobs = contractorJobs.filter(job => {
    const today = new Date().toISOString().split('T')[0];
    const jobStart = new Date(job.startDate).toISOString().split('T')[0];
    const jobEnd = new Date(job.endDate).toISOString().split('T')[0];
    return today >= jobStart && today <= jobEnd && (job.status === 'scheduled' || job.status === 'in_progress');
  });

  // Get upcoming reminders for contractor's jobs
  const upcomingReminders = contractorJobs
    .flatMap(job => job.reminders.map(reminder => ({ ...reminder, jobTitle: job.title })))
    .filter(reminder => new Date(reminder.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

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

  const getPriorityLevel = (job: Job) => {
    const today = new Date();
    const startDate = new Date(job.startDate);
    const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilStart <= 1) return 'high';
    if (daysUntilStart <= 3) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-green-500 bg-green-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>My Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
          {user?.specialties && (
            <div className="flex flex-wrap gap-1 mt-2">
              {user.specialties.map(specialty => (
                <Badge key={specialty} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Jobs</p>
                <p className="text-2xl font-bold">{todayJobs.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold">{activeJobs.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{completedJobs.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Messages</p>
                <p className="text-2xl font-bold">
                  {communications.filter(c => c.contractorId === user?.id && c.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Jobs Alert */}
      {todayJobs.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>You have {todayJobs.length} job(s) scheduled for today:</strong>
            <div className="mt-2 space-y-1">
              {todayJobs.map(job => (
                <div key={job.id} className="text-sm">
                  <span className="font-medium">{job.title}</span> - {job.clientName} ({job.clientAddress})
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Upcoming Reminders:</strong>
            <div className="mt-2 space-y-1">
              {upcomingReminders.map(reminder => (
                <div key={reminder.id} className="text-sm">
                  <span className="font-medium">{reminder.date}</span> - {reminder.message} ({reminder.jobTitle})
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="jobs">My Jobs</TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
            {communications.filter(c => c.contractorId === user?.id && c.status === 'resolved' && !c.adminResponse).length > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                {communications.filter(c => c.contractorId === user?.id && c.status === 'resolved').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <JobCalendar />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          {contractorJobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Assigned</h3>
                <p className="text-gray-600">You don't have any jobs assigned yet. Check back later or contact your admin.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {contractorJobs
                .sort((a, b) => {
                  // Sort by priority first, then by start date
                  const priorityOrder = { high: 0, medium: 1, low: 2 };
                  const priorityA = getPriorityLevel(a);
                  const priorityB = getPriorityLevel(b);
                  
                  if (priorityA !== priorityB) {
                    return priorityOrder[priorityA as keyof typeof priorityOrder] - priorityOrder[priorityB as keyof typeof priorityOrder];
                  }
                  
                  return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                })
                .map(job => {
                  const priority = getPriorityLevel(job);
                  const otherCrewMembers = job.assignedCrew
                    .filter(id => id !== user?.id)
                    .map(id => users.find(u => u.id === id))
                    .filter(Boolean);

                  return (
                    <Card key={job.id} className={`border-l-4 ${getPriorityColor(priority)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getProjectTypeIcon(job.projectType)}</span>
                            <div>
                              <h3 className="font-semibold">{job.title}</h3>
                              <p className="text-sm text-gray-600">{job.clientName}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{job.clientAddress}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{job.startDate} to {job.endDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{job.estimatedHours} hours estimated</span>
                          </div>
                          {otherCrewMembers.length > 0 && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>Working with: {otherCrewMembers.map(member => member?.name).join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {job.notes && (
                          <div className="bg-white p-3 rounded border mb-3">
                            <p className="text-sm"><strong>Notes:</strong> {job.notes}</p>
                          </div>
                        )}

                        {job.reminders.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-700 mb-2">Reminders:</p>
                            <div className="space-y-1">
                              {job.reminders.map(reminder => (
                                <div key={reminder.id} className="text-xs bg-white p-2 rounded border">
                                  <span className="font-medium">{reminder.date}</span> - {reminder.message}
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    {reminder.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between pt-3 border-t">
                          <Button
                            size="sm"
                            variant="outline" 
                            onClick={() => setSelectedJobForComm(job)}
                            className="flex items-center gap-2"
                          >
                            <Send className="h-3 w-3" />
                            Send Message
                          </Button>
                          
                          {priority === 'high' && (
                            <div className="p-2 bg-red-100 border border-red-200 rounded">
                              <p className="text-xs text-red-800 font-medium">
                                🚨 High Priority - Starting soon!
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <div className="grid gap-4">
            {communications
              .filter(comm => comm.contractorId === user?.id)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(comm => {
                const job = jobs.find(j => j.id === comm.jobId);
                return (
                  <Card key={comm.id} className={comm.status === 'resolved' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{comm.subject}</h4>
                          <p className="text-sm text-gray-600">
                            Job: {job?.title} • {new Date(comm.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={comm.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {comm.status}
                        </Badge>
                      </div>
                      
                      <div className="bg-white p-3 rounded border mb-3">
                        <p className="text-sm">{comm.message}</p>
                      </div>
                      
                      {comm.adminResponse && (
                        <div className="bg-blue-50 p-3 rounded border">
                          <p className="text-xs text-blue-600 font-medium mb-1">Admin Response:</p>
                          <p className="text-sm">{comm.adminResponse}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            
            {communications.filter(comm => comm.contractorId === user?.id).length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Messages</h4>
                  <p className="text-gray-600">You haven't sent any messages to admin yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Communication Form Dialog */}
      <Dialog open={!!selectedJobForComm} onOpenChange={() => setSelectedJobForComm(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Message to Admin</DialogTitle>
          </DialogHeader>
          {selectedJobForComm && (
            <CommunicationForm
              job={selectedJobForComm}
              onCancel={() => setSelectedJobForComm(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}