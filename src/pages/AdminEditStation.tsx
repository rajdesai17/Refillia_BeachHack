import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const AdminEditStation = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [station, setStation] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [landmark, setLandmark] = useState('');
  const [contact, setContact] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [days, setDays] = useState('Monday-Friday');
  const [waterLevel, setWaterLevel] = useState('100%');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStation = async () => {
      if (!isAdmin) {
        navigate('/admin');
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('refill_stations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setStation(data);
        setName(data.name || '');
        setDescription(data.description || '');
        setLandmark(data.landmark || '');
        setContact(data.contact || '');
        setOpeningTime(data.opening_time || '');
        setClosingTime(data.closing_time || '');
        setDays(data.days || 'Monday-Friday');
        setWaterLevel(data.water_level || '100%');
      } catch (error) {
        console.error('Error fetching station:', error);
        toast({
          title: 'Error',
          description: 'Failed to load station details',
          variant: 'destructive',
        });
        navigate('/admin');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStation();
  }, [id, isAdmin, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('refill_stations')
        .update({
          name,
          description,
          landmark,
          contact,
          opening_time: openingTime,
          closing_time: closingTime,
          days,
          water_level: waterLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Station updated successfully.',
      });

      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    } catch (error) {
      console.error('Error updating station:', error);
      toast({
        title: 'Error',
        description: 'Failed to update station. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-refillia-blue"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Edit Station (Admin)</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Station Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input
                      id="landmark"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact">Contact</Label>
                    <Input
                      id="contact"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="openingTime">Opening Time</Label>
                      <Input
                        id="openingTime"
                        type="time"
                        value={openingTime}
                        onChange={(e) => setOpeningTime(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="closingTime">Closing Time</Label>
                      <Input
                        id="closingTime"
                        type="time"
                        value={closingTime}
                        onChange={(e) => setClosingTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="days">Operating Days</Label>
                    <select
                      id="days"
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="Monday-Friday">Monday-Friday</option>
                      <option value="Saturday-Sunday">Saturday-Sunday</option>
                      <option value="All Days">All Days</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="waterLevel">Water Level</Label>
                    <select
                      id="waterLevel"
                      value={waterLevel}
                      onChange={(e) => setWaterLevel(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="100%">Full (100%)</option>
                      <option value="75%">Good (75%)</option>
                      <option value="50%">Half (50%)</option>
                      <option value="25%">Low (25%)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-refillia-blue hover:bg-refillia-darkBlue"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Station'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminEditStation;