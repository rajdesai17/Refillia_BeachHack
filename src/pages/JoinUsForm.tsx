import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react'; // Import MapPin icon

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448636.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const JoinUsForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [landmark, setLandmark] = useState('');
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [contact, setContact] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [days, setDays] = useState('Monday-Friday');
  const [waterLevel, setWaterLevel] = useState('100%');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
    position: '',
  });
  const mapRef = useRef<L.Map | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get user's location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setPosition(userPos);
          
          // If map is loaded, fly to user location
          if (mapRef.current) {
            mapRef.current.flyTo(userPos, 15);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: 'Location access denied',
            description: 'Using default location in India.',
          });
        }
      );
    }
  }, [toast]);

  const validateForm = () => {
    let isValid = true;
    const errors = {
      name: '',
      description: '',
      position: '',
    };

    if (!name.trim()) {
      errors.name = 'Station name is required';
      isValid = false;
    }

    if (!description.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    }

    if (!position) {
      errors.position = 'Please select a location on the map';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Form Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to add a refill station.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const { data, error } = await supabase.from('refill_stations').insert([{
        name,
        description,
        landmark: landmark || null,
        latitude: position![0],
        longitude: position![1],
        contact,
        opening_time: openingTime,
        closing_time: closingTime,
        days,
        water_level: waterLevel,
        status: 'unverified',
        added_by: user.id,
      }]);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Refill station added successfully. Thank you for your contribution!',
      });

      setName('');
      setDescription('');
      setLandmark('');
      setPosition(null);
      setContact('');
      setOpeningTime('');
      setClosingTime('');
      setDays('Monday-Friday');
      setWaterLevel('100%');
      setFormErrors({ name: '', description: '', position: '' });

      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error) {
      console.error('Error submitting station:', error);
      toast({
        title: 'Error',
        description: 'Failed to add refill station. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom map components
  const LocationMarker = () => {
    useMapEvents({
      click: (e) => {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });

    return position ? (
      <Marker position={position} icon={customIcon} />
    ) : null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Join Us - Add a Refill Station</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Map Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-[60vh]">
                <MapContainer
                  center={position || [20.5937, 78.9629]}
                  zoom={position ? 15 : 5}
                  className="h-full w-full"
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker />
                </MapContainer>
              </div>
              <div className="p-4 bg-refillia-lightBlue">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-refillia-blue mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Click on the map to select the exact location of the refill station.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name">Station Name</Label>
                    <Input
                      id="name"
                      placeholder="E.g., Central Park Fountain"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide details about the station (location hints, working hours, etc.)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={formErrors.description ? 'border-red-500' : ''}
                      rows={4}
                    />
                    {formErrors.description && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="landmark">Landmark (Optional)</Label>
                    <Input
                      id="landmark"
                      placeholder="E.g., Near the main entrance"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact">Contact Details</Label>
                    <Input
                      id="contact"
                      placeholder="E.g., +1234567890"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>

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

                  <div>
                    <Label htmlFor="days">Days</Label>
                    <select
                      id="days"
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
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
                    >
                      <option value="100%">100%</option>
                      <option value="75%">75%</option>
                      <option value="50%">50%</option>
                      <option value="25%">25%</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-refillia-blue hover:bg-refillia-darkBlue"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default JoinUsForm;