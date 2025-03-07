import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPin, Navigation, MessageCircle, ThumbsUp, ThumbsDown, Search, Check, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { RefillStation } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from "@/contexts/AuthContext";

// Fix for Leaflet marker icon
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Add this interface at the top of the file
interface RefillStation {
  id: string;
  name: string;
  description: string;
  landmark: string | null;
  status: 'verified' | 'unverified' | 'reported';
  latitude: number;
  longitude: number;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
  opening_time?: string | null;
  closing_time?: string | null;
  days?: string | null;
  water_level?: string | null;
  contact?: string | null;
}

// Custom marker icon
const customIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom user location icon
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3710/3710297.png",
  iconSize: [25, 25],
  iconAnchor: [12, 25],
});

// Default position (center of India)
const defaultPosition: [number, number] = [20.5937, 78.9629];

const FindStations = () => {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [selectedStation, setSelectedStation] = useState<RefillStation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  // Inside your FindStations component, add these state variables
  const [showRefillDialog, setShowRefillDialog] = useState(false);
  const [currentStationId, setCurrentStationId] = useState<string | null>(null);
  const { profile } = useAuth();
  
  // Fetch stations from Supabase - only verified ones
  const fetchStations = useCallback(async () => {
    console.log("Fetching verified stations");
    const { data, error } = await supabase
      .from('refill_stations')
      .select('*')
      .eq('status', 'verified');
    
    if (error) {
      console.error("Error fetching verified stations:", error);
      throw error;
    }
    
    console.log("Verified stations:", data);
    return (data || []).map(station => ({
      id: station.id,
      name: station.name,
      description: station.description,
      landmark: station.landmark,
      status: station.status as 'verified' | 'unverified' | 'reported',
      latitude: parseFloat(station.latitude.toString()),
      longitude: parseFloat(station.longitude.toString()),
      addedBy: station.added_by,
      createdAt: station.created_at,
      updatedAt: station.updated_at,
      opening_time: station.opening_time || null,
      closing_time: station.closing_time || null,
      days: station.days || null,
      water_level: station.water_level || null,
      contact: station.contact || null
    } as RefillStation));
  }, []);
  
  const { 
    data: stations = [], 
    isLoading, 
    error,
    refetch: refetchStations
  } = useQuery({
    queryKey: ['verifiedRefillStations'],
    queryFn: fetchStations,
    refetchOnWindowFocus: true,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location access denied",
            description: "Using default location in India.",
          });
        }
      );
    }
  }, [toast]);

  // Filter stations based on search query
  const filteredStations = stations.filter(station => 
    searchQuery === "" || 
    station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (station.landmark && station.landmark.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Update the handleGetDirections function
  const handleGetDirections = (stationId: string, latitude: number, longitude: number) => {
    // Store the station ID in the database if user is logged in
    if (profile?.id) {
      // Store the pending refill in Supabase
      supabase
        .from('refill_activities')
        .insert([{
          user_id: profile.id,
          station_id: stationId,
          refilled: false,
          points_earned: 0,
          bottles_saved: 0
        }])
        .then(({ error }) => {
          if (error) console.error('Error storing refill activity:', error);
          
          // Set session storage to trigger dialog when coming back to the app
          // This is just for UX purposes, the actual tracking is in the database
          sessionStorage.setItem('pendingRefillStation', stationId);
          sessionStorage.setItem('pendingRefillTime', new Date().toISOString());
        });
    }
    
    // Open Google Maps directions
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      "_blank"
    );
  };

  // Add this useEffect to check if user is returning from getting directions
  useEffect(() => {
    const checkRefillStatus = async () => {
      if (!profile?.id) return;
      
      const pendingStationId = sessionStorage.getItem('pendingRefillStation');
      const pendingRefillTime = sessionStorage.getItem('pendingRefillTime');
      
      if (pendingStationId && pendingRefillTime) {
        const refillTimestamp = new Date(pendingRefillTime).getTime();
        const currentTime = new Date().getTime();
        const minutesPassed = (currentTime - refillTimestamp) / (1000 * 60);
        
        // If less than 30 minutes have passed, show the dialog
        if (minutesPassed < 30) {
          // Check if this pending refill exists in the database
          const { data, error } = await supabase
            .from('refill_activities')
            .select('*')
            .eq('user_id', profile.id)
            .eq('station_id', pendingStationId)
            .eq('refilled', false)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (error) {
            console.error('Error checking pending refill:', error);
            return;
          }
          
          if (data && data.length > 0) {
            setCurrentStationId(pendingStationId);
            setShowRefillDialog(true);
          }
          
          // Remove from session storage either way
          sessionStorage.removeItem('pendingRefillStation');
          sessionStorage.removeItem('pendingRefillTime');
        }
      }
    };
    
    // Check after a short delay to ensure the page has fully loaded
    const timer = setTimeout(checkRefillStatus, 1000);
    return () => clearTimeout(timer);
  }, [profile?.id]);

  // Add function to handle refill confirmation
  const handleRefillConfirmation = async (didRefill: boolean) => {
    if (!currentStationId || !profile?.id) {
      setShowRefillDialog(false);
      return;
    }
    
    try {
      const pointsToAdd = didRefill ? 10 : 1;
      const bottlesToAdd = didRefill ? 1 : 0;
      
      // Update the refill activity in the database
      const { error } = await supabase
        .from('refill_activities')
        .update({
          refilled: didRefill,
          points_earned: pointsToAdd,
          bottles_saved: bottlesToAdd
        })
        .eq('user_id', profile.id)
        .eq('station_id', currentStationId)
        .eq('refilled', false);
      
      if (error) throw error;
      
      // Update the user profile stats
      await supabase.rpc('update_user_stats', {
        user_id_param: profile.id,
        points_to_add: pointsToAdd,
        bottles_to_add: bottlesToAdd
      });
      
      toast({
        title: didRefill ? "Refill Completed!" : "Thank you for your feedback",
        description: didRefill 
          ? "You've earned 10 points and saved 1 plastic bottle! Keep it up!" 
          : "You've earned 1 point for checking. Better luck next time!",
      });
      
      // Refresh user profile to show updated points
      queryClient.invalidateQueries(['userProfile', profile.id]);
      
    } catch (error) {
      console.error("Error updating refill stats:", error);
      toast({
        title: "Error",
        description: "Failed to update your refill stats. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowRefillDialog(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">Find Refill Stations</h1>
            <p className="text-gray-600">Search for nearby refill stations and get directions.</p>
          </div>
          <div className="mb-8">
            <Input
              type="text"
              placeholder="Search for stations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-red-600">Error loading stations.</div>
              </div>
            ) : (
              <MapContainer
                center={defaultPosition}
                zoom={5}
                style={{ height: "500px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {showUserLocation && userPosition && (
                  <Marker position={userPosition} icon={userIcon}>
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-gray-900">Your Location</h3>
                        <p className="text-sm text-gray-600">You are here.</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {filteredStations.map((station) => (
                  <Marker
                    key={station.id}
                    position={[station.latitude, station.longitude]}
                    icon={customIcon}
                    eventHandlers={{
                      click: () => setSelectedStation(station),
                    }}
                  >
                    <Popup>
                      <div className="p-2 max-w-[300px]">
                        <h3 className="font-semibold text-gray-900 text-lg">{station.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{station.description}</p>
                        
                        {(station.opening_time || station.closing_time) && (
                          <div className="text-xs text-gray-700 mb-2">
                            <strong>Hours:</strong> {station.opening_time || 'N/A'} - {station.closing_time || 'N/A'}
                          </div>
                        )}
                        
                        {station.days && (
                          <div className="text-xs text-gray-700 mb-2">
                            <strong>Days Open:</strong> {station.days}
                          </div>
                        )}
                        
                        {station.water_level && (
                          <div className="text-xs text-gray-700 mb-2">
                            <strong>Water Level:</strong> {station.water_level}
                          </div>
                        )}
                        
                        {station.contact && (
                          <div className="text-xs text-gray-700 mb-2">
                            <strong>Contact:</strong> {station.contact}
                          </div>
                        )}
                        
                        {station.landmark && (
                          <div className="text-xs text-gray-700 mb-2">
                            <strong>Landmark:</strong> {station.landmark}
                          </div>
                        )}
                        
                        <div className="flex items-center mb-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Verified
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            className="bg-refillia-blue hover:bg-refillia-darkBlue w-full"
                            onClick={() => handleGetDirections(station.id, station.latitude, station.longitude)}
                          >
                            <Navigation className="mr-1 h-4 w-4" />
                            Get Directions
                          </Button>
                          <div className="flex justify-between gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-refillia-green text-refillia-green hover:bg-green-50"
                              onClick={() => handleFeedback(station.id, true)}
                            >
                              <ThumbsUp className="mr-1 h-4 w-4" />
                              Helpful
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-400 text-red-400 hover:bg-red-50"
                              onClick={() => handleFeedback(station.id, false)}
                            >
                              <ThumbsDown className="mr-1 h-4 w-4" />
                              Issue
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Component to fly to selected station from search */}
                {selectedStation && (
                  <FlyToSelectedStation 
                    station={selectedStation} 
                    setSelectedStation={setSelectedStation} 
                  />
                )}
              </MapContainer>
            )}
          </div>
        </div>

        {/* Refill Confirmation Dialog */}
        <Dialog open={showRefillDialog} onOpenChange={setShowRefillDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Did you refill your bottle?</DialogTitle>
              <DialogDescription>
                Let us know if you successfully refilled your water bottle at this location.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button 
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => handleRefillConfirmation(true)}
              >
                <Check className="h-5 w-5" />
                Yes, I did!
              </Button>
              
              <Button 
                variant="outline"
                className="flex items-center justify-center gap-2"
                onClick={() => handleRefillConfirmation(false)}
              >
                <X className="h-5 w-5" />
                Not this time
              </Button>
            </div>
            
            <DialogFooter className="sm:justify-between">
              <div className="text-sm text-gray-500">
                Refilling earns you 10 points and counts as 1 plastic bottle saved!
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

// Component to fly to selected station from search
const FlyToSelectedStation = ({ 
  station, 
  setSelectedStation 
}: { 
  station: RefillStation, 
  setSelectedStation: (station: RefillStation | null) => void 
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (station) {
      map.flyTo([station.latitude, station.longitude], 16);
      
      // Create a timeout to clear the selection after the map has flown to it
      const timeout = setTimeout(() => {
        setSelectedStation(null);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [map, station, setSelectedStation]);
  
  return null;
};

export default FindStations;
