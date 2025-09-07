import React, { useState } from 'react';
import { useAuth, Job } from './AuthProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

interface CommunicationFormProps {
  job: Job;
  onCancel: () => void;
}

export function CommunicationForm({ job, onCancel }: CommunicationFormProps) {
  const { addCommunication, user } = useAuth();
  
  const [formData, setFormData] = useState({
    type: 'material_request' as const,
    subject: '',
    message: '',
    priority: 'medium' as const
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    addCommunication({
      jobId: job.id,
      contractorId: user.id,
      status: 'pending',
      ...formData
    });

    toast.success('Communication sent to admin successfully');
    onCancel();
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'material_request': return 'Request additional materials or supplies';
      case 'change_order': return 'Request approval for project changes';
      case 'issue_report': return 'Report problems or obstacles';
      case 'question': return 'Ask questions about the project';
      case 'other': return 'Other communication';
      default: return '';
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Send Message to Admin
        </CardTitle>
        <p className="text-sm text-gray-600">
          Job: {job.title} - {job.clientName}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Communication Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="material_request">Material Request</SelectItem>
                <SelectItem value="change_order">Change Order</SelectItem>
                <SelectItem value="issue_report">Issue Report</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {getTypeDescription(formData.type)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Can wait</SelectItem>
                <SelectItem value="medium">Medium - Normal priority</SelectItem>
                <SelectItem value="high">High - Urgent attention needed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Brief summary of your request"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Provide detailed information about your request..."
              rows={5}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Message
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
