import React, { useState } from 'react';
import { useAuth, Job } from './AuthProvider';
import { JobCalendar } from './JobCalendar';
import { JobForm } from './JobForm';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Calendar, 
  MapPin, 
  Clock,
  Briefcase,
  TrendingUp,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { CommunicationManager } from './CommunicationManager';

export function AdminDashboard() {
  const { jobs, users, communications, addJob, updateJob, deleteJob, user } = useAuth();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);

  const contractors = users.filter(u => u.role === 'contractor');
  const activeJobs = jobs.filter(job => job.status === 'in_progress' || job.status === 'scheduled');
  const completedJobs = jobs.filter(job => job.status === 'completed');

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

  const handleJobSubmit = (jobData: Job | Omit<Job, 'id'>) => {
    if ('id' in jobData) {
      updateJob(jobData.id, jobData);
    } else {
      addJob(jobData);
    }
    setShowJobForm(false);
    setSelectedJob(null);
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setShowJobForm(true);
  };

  const handleDeleteJob = (jobId: string) => {
    if (confirm('Are you sure you want to delete this job?')) {
      deleteJob(jobId);
    }
  };

  const upcomingReminders = jobs
    .flatMap(job => job.reminders.map(reminder => ({ ...reminder, jobTitle: job.title })))
    .filter(reminder => new Date(reminder.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <Button onClick={() => setShowJobForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold">{activeJobs.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500" />
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
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contractors</p>
                <p className="text-2xl font-bold">{contractors.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Communications</p>
                <p className="text-2xl font-bold">
                  {communications.filter(c => c.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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
          <TabsTrigger value="jobs">Job List</TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Communications
            {communications.filter(c => c.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                {communications.filter(c => c.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="contractors">Contractors</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <JobCalendar />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="grid gap-4">
            {jobs.map(job => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">{getProjectTypeIcon(job.projectType)}</span>
                        <h3 className="font-semibold">{job.title}</h3>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{job.clientName} - {job.clientAddress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{job.startDate} to {job.endDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Assigned Crew:</span>
                        <div className="flex flex-wrap gap-1">
                          {job.assignedCrew.map(crewId => {
                            const contractor = contractors.find(c => c.id === crewId);
                            return contractor ? (
                              <Badge key={crewId} variant="secondary" className="text-xs">
                                {contractor.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>

                      {job.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {job.notes}
                        </p>
                      )}

                      {job.reminders.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">
                            {job.reminders.length} reminder(s) set
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditJob(job)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteJob(job.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <CommunicationManager />
        </TabsContent>

        <TabsContent value="contractors">
          <div className="grid gap-4">
            {contractors.map(contractor => {
              const contractorJobs = jobs.filter(job => job.assignedCrew.includes(contractor.id));
              const activeContractorJobs = contractorJobs.filter(job => 
                job.status === 'in_progress' || job.status === 'scheduled'
              );

              return (
                <Card key={contractor.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{contractor.name}</h3>
                        <p className="text-sm text-gray-600">@{contractor.username}</p>
                        {contractor.specialties && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {contractor.specialties.map(specialty => (
                              <Badge key={specialty} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Active Jobs</p>
                        <p className="text-xl font-bold">{activeContractorJobs.length}</p>
                      </div>
                    </div>
                    
                    {activeContractorJobs.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium mb-2">Current Assignments:</p>
                        <div className="space-y-1">
                          {activeContractorJobs.map(job => (
                            <div key={job.id} className="text-sm flex items-center justify-between">
                              <span>{job.title}</span>
                              <Badge className={getStatusColor(job.status)} variant="secondary">
                                {job.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Job Form Dialog */}
      <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedJob ? 'Edit Job' : 'Create New Job'}
            </DialogTitle>
          </DialogHeader>
          <JobForm
            job={selectedJob || undefined}
            onSubmit={handleJobSubmit}
            onCancel={() => {
              setShowJobForm(false);
              setSelectedJob(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}