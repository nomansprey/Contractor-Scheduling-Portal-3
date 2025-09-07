import React, { useState } from 'react';
import { useAuth, Communication } from './AuthProvider';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Package,
  FileEdit,
  HelpCircle,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function CommunicationManager() {
  const { communications, resolveCommunication, users, jobs } = useAuth();
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  const pendingCommunications = communications.filter(comm => comm.status === 'pending');
  const resolvedCommunications = communications.filter(comm => comm.status === 'resolved');

  const getTypeIcon = (type: Communication['type']) => {
    switch (type) {
      case 'material_request': return <Package className="h-4 w-4" />;
      case 'change_order': return <FileEdit className="h-4 w-4" />;
      case 'issue_report': return <AlertTriangle className="h-4 w-4" />;
      case 'question': return <HelpCircle className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: Communication['type']) => {
    switch (type) {
      case 'material_request': return 'bg-blue-100 text-blue-800';
      case 'change_order': return 'bg-orange-100 text-orange-800';
      case 'issue_report': return 'bg-red-100 text-red-800';
      case 'question': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Communication['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleResolve = () => {
    if (!selectedComm || !adminResponse.trim()) {
      toast.error('Please provide a response before resolving');
      return;
    }

    resolveCommunication(selectedComm.id, adminResponse);
    toast.success('Communication resolved and response sent');
    setSelectedComm(null);
    setAdminResponse('');
  };

  const getContractorName = (contractorId: string) => {
    const contractor = users.find(u => u.id === contractorId);
    return contractor?.name || 'Unknown Contractor';
  };

  const getJobTitle = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    return job?.title || 'Unknown Job';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <h2>Communications</h2>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {pendingCommunications.length} Pending
          </Badge>
          <Badge className="flex items-center gap-1 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            {resolvedCommunications.length} Resolved
          </Badge>
        </div>
      </div>

      {/* Pending Communications */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          Pending Communications ({pendingCommunications.length})
        </h3>
        
        {pendingCommunications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Pending Communications</h4>
              <p className="text-gray-600">All communications have been resolved.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingCommunications
              .sort((a, b) => {
                // Sort by priority first (high, medium, low), then by date
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                if (priorityDiff !== 0) return priorityDiff;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .map(comm => (
                <Card key={comm.id} className={`border-l-4 ${comm.priority === 'high' ? 'border-l-red-500' : comm.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(comm.type)}
                        <div>
                          <h4 className="font-medium">{comm.subject}</h4>
                          <p className="text-sm text-gray-600">
                            {getContractorName(comm.contractorId)} • {getJobTitle(comm.jobId)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getTypeColor(comm.type)}>
                          {comm.type.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(comm.priority)}>
                          {comm.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded mb-3">
                      <p className="text-sm">{comm.message}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Sent {formatDate(comm.createdAt)}
                      </span>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedComm(comm);
                              setAdminResponse('');
                            }}
                          >
                            Respond & Resolve
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Respond to Communication</DialogTitle>
                          </DialogHeader>
                          
                          {selectedComm && (
                            <div className="space-y-4">
                              <div className="bg-gray-50 p-4 rounded">
                                <div className="flex items-center gap-2 mb-2">
                                  {getTypeIcon(selectedComm.type)}
                                  <strong>{selectedComm.subject}</strong>
                                  <Badge className={getTypeColor(selectedComm.type)}>
                                    {selectedComm.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  From: {getContractorName(selectedComm.contractorId)} • Job: {getJobTitle(selectedComm.jobId)}
                                </p>
                                <p className="text-sm">{selectedComm.message}</p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="response">Admin Response</Label>
                                <Textarea
                                  id="response"
                                  value={adminResponse}
                                  onChange={(e) => setAdminResponse(e.target.value)}
                                  placeholder="Provide your response and any instructions for the contractor..."
                                  rows={4}
                                />
                              </div>
                              
                              <div className="flex gap-3">
                                <Button onClick={handleResolve}>
                                  Resolve Communication
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setSelectedComm(null);
                                    setAdminResponse('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Resolved Communications */}
      {resolvedCommunications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Recently Resolved ({resolvedCommunications.slice(0, 5).length} of {resolvedCommunications.length})
          </h3>
          
          <div className="grid gap-3">
            {resolvedCommunications
              .sort((a, b) => new Date(b.resolvedAt || '').getTime() - new Date(a.resolvedAt || '').getTime())
              .slice(0, 5)
              .map(comm => (
                <Card key={comm.id} className="bg-green-50 border-green-200">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(comm.type)}
                        <div>
                          <p className="font-medium text-sm">{comm.subject}</p>
                          <p className="text-xs text-gray-600">
                            {getContractorName(comm.contractorId)} • {getJobTitle(comm.jobId)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {comm.resolvedAt && formatDate(comm.resolvedAt)}
                        </p>
                      </div>
                    </div>
                    
                    {comm.adminResponse && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-xs text-gray-600 mb-1">Admin Response:</p>
                        <p className="text-sm">{comm.adminResponse}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}