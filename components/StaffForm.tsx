import React, { useState } from 'react';
import { User } from './AuthProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X, Plus } from 'lucide-react';

interface StaffFormProps {
  staff?: User;
  onSubmit: (staffData: User | Omit<User, 'id'>) => void;
  onCancel: () => void;
}

export function StaffForm({ staff, onSubmit, onCancel }: StaffFormProps) {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    username: staff?.username || '',
    specialties: staff?.specialties || []
  });
  const [newSpecialty, setNewSpecialty] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.username.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const staffData = {
      ...formData,
      role: 'contractor' as const,
      specialties: formData.specialties.length > 0 ? formData.specialties : undefined
    };

    if (staff) {
      onSubmit({ ...staffData, id: staff.id });
    } else {
      onSubmit(staffData);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSpecialty();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{staff ? 'Edit Contractor' : 'Add New Contractor'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., John Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="e.g., john_contractor"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Specialties</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.specialties.map(specialty => (
                <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                  {specialty}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-red-500" 
                    onClick={() => removeSpecialty(specialty)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add specialty (e.g., Plumbing, Electrical)"
              />
              <Button type="button" onClick={addSpecialty} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Common specialties: Plumbing, Electrical, Tile Work, Flooring, Painting, Drywall, HVAC, Carpentry
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {staff ? 'Update Contractor' : 'Add Contractor'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
