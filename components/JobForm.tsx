import React, { useState, useEffect } from 'react';
import { useAuth, Job, Reminder } from './AuthProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { X, Plus, Calendar, Clock, MapPin } from 'lucide-react';

interface JobFormProps {
  job?: Job;
  onSubmit: (job: Omit<Job, 'id'> | Job) => void;
  onCancel: () => void;
}

export function JobForm({ job, onSubmit, onCancel }: JobFormProps) {
  const { users } = useAuth();
  const contractors = users.filter(user => user.role === 'contractor');

  const [formData, setFormData] = useState({
    title: job?.title || '',
    clientName: job?.clientName || '',
    clientAddress: job?.clientAddress || '',
    startDate: job?.startDate || '',
    endDate: job?.endDate || '',
    assignedCrew: job?.assignedCrew || [],
    status: job?.status || 'scheduled' as Job['status'],
    notes: job?.notes || '',
    projectType: job?.projectType || 'bathroom' as Job['projectType'],
    reminders: job?.reminders || []
  });

  const [newReminder, setNewReminder] = useState({
    date: '',
    message: '',
    type: 'general' as Reminder['type']
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCrewToggle = (contractorId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedCrew: prev.assignedCrew.includes(contractorId)
        ? prev.assignedCrew.filter(id => id !== contractorId)
        : [...prev.assignedCrew, contractorId]
    }));
  };

  const addReminder = () => {
    if (newReminder.date && newReminder.message) {
      const reminder: Reminder = {
        id: Date.now().toString(),
        ...newReminder
      };
      setFormData(prev => ({
        ...prev,
        reminders: [...prev.reminders, reminder]
      }));
      setNewReminder({ date: '', message: '', type: 'general' });
    }
  };

  const removeReminder = (reminderId: string) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => r.id !== reminderId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (job) {
      onSubmit({ ...job, ...formData });
    } else {
      onSubmit(formData);
    }
  };

  const getReminderTypeColor = (type: Reminder['type']) => {
    switch (type) {
      case 'material_delivery': return 'bg-blue-100 text-blue-800';
      case 'inspection': return 'bg-orange-100 text-orange-800';
      case 'client_meeting': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {job ? 'Edit Job' : 'Create New Job'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Master Bathroom Renovation"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type</Label>
              <Select value={formData.projectType} onValueChange={(value) => handleInputChange('projectType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bathroom">Bathroom</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              placeholder="Client full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientAddress">Client Address</Label>
            <Input
              id="clientAddress"
              value={formData.clientAddress}
              onChange={(e) => handleInputChange('clientAddress', e.target.value)}
              placeholder="Full address including city and state"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                min={formData.startDate}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Assigned Crew</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contractors.map(contractor => (
                <div key={contractor.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={contractor.id}
                    checked={formData.assignedCrew.includes(contractor.id)}
                    onCheckedChange={() => handleCrewToggle(contractor.id)}
                  />
                  <Label htmlFor={contractor.id} className="flex-1">
                    <div>
                      <div className="font-medium">{contractor.name}</div>
                      <div className="text-sm text-gray-500">
                        {contractor.specialties?.join(', ')}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional details, special requirements, etc."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Reminders</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                type="date"
                value={newReminder.date}
                onChange={(e) => setNewReminder(prev => ({ ...prev, date: e.target.value }))}
                placeholder="Reminder date"
              />
              <Input
                value={newReminder.message}
                onChange={(e) => setNewReminder(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Reminder message"
              />
              <Select value={newReminder.type} onValueChange={(value) => setNewReminder(prev => ({ ...prev, type: value as Reminder['type'] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="material_delivery">Material Delivery</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="client_meeting">Client Meeting</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" onClick={addReminder} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.reminders.length > 0 && (
              <div className="space-y-2">
                {formData.reminders.map(reminder => (
                  <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getReminderTypeColor(reminder.type)}>
                        {reminder.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm">{reminder.date}</span>
                      <span>{reminder.message}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReminder(reminder.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit">
              {job ? 'Update Job' : 'Create Job'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}