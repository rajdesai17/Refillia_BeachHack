import { useState, useEffect, useCallback, useRef } from "react";
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
import { useQueryClient } from "@tanstack/react-query";

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
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="marker-pin"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
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
  // Add mapRef at the component level
  const mapRef = useRef<L.Map | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [selectedStation, setSelectedStation] = useState<RefillStation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  // Inside your FindStations component, add these state variables
  const [showRefillDialog, setShowRefillDialog] = useState(false);
  const [currentStationId, setCurrentStationId] = useState<string | null>(null);
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
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
          const userPos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserPosition(userPos);
          if (showUserLocation && mapRef.current) {
            mapRef.current.flyTo(
              userPos,
              15,
              {
                duration: 1.5 // Animation duration in seconds
              }
            );
          }
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
  }, [showUserLocation, toast]);

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

  // Add this function inside the FindStations component, before the return statement

const handleFeedback = async (stationId: string, isHelpful: boolean) => {
  if (!profile?.id) {
    toast({
      title: "Login Required",
      description: "Please sign in to provide feedback.",
      variant: "destructive",
    });
    return;
  }

  try {
    // First check if user has already given feedback
    const { data: existingFeedback } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', profile.id)
      .eq('station_id', stationId)
      .single();

    if (existingFeedback) {
      toast({
        title: "Already Submitted",
        description: "You have already provided feedback for this station.",
        variant: "destructive",
      });
      return;
    }

    // Add feedback to the database
    const { error: feedbackError } = await supabase
      .from('feedback')
      .insert([{
        user_id: profile.id,
        station_id: stationId,
        rating: isHelpful ? 5 : 1,
        comment: isHelpful ? "Station is helpful" : "Issue reported with station",
      }]);

    if (feedbackError) throw feedbackError;

    // Update user profile directly
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        points: profile.points + 10,
        feedback_given: (profile.feedbackGiven || 0) + 1
      })
      .eq('id', profile.id);

    if (updateError) throw updateError;

    // Show success message
    toast({
      title: isHelpful ? "Thank You!" : "Feedback Received",
      description: isHelpful 
        ? "Thanks for marking this station as helpful! You earned 10 points." 
        : "Thank you for reporting this issue. We'll look into it.",
    });

    // Refresh user profile
    queryClient.invalidateQueries(['userProfile', profile.id]);

  } catch (error) {
    console.error("Error submitting feedback:", error);
    toast({
      title: "Error",
      description: "Failed to submit feedback. Please try again.",
      variant: "destructive",
    });
  }
};

  // Update the handleSearch function
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') return;

    const matchedStation = stations.find(station =>
      station.name.toLowerCase().includes(query.toLowerCase()) ||
      station.description.toLowerCase().includes(query.toLowerCase()) ||
      (station.landmark && station.landmark.toLowerCase().includes(query.toLowerCase()))
    );

    if (matchedStation) {
      // Set the selected station to trigger the FlyToSelectedStation component
      setSelectedStation(matchedStation);
      
      // Also update the map view directly
      if (mapRef.current) {
        mapRef.current.flyTo(
          [matchedStation.latitude, matchedStation.longitude],
          16,
          {
            duration: 1.5,
            easeLinearity: 0.25
          }
        );
      }
    }
  };

  // Map controller component to handle map interactions
  const MapController = () => {
    const map = useMap();
    
    // Store map reference and handle initial user location
    useEffect(() => {
      if (map) {
        mapRef.current = map;
        if (showUserLocation && userPosition) {
          map.flyTo(userPosition, 15);
        }
      }
    }, [map, showUserLocation, userPosition]);
    
    return null;
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
        map.flyTo(
          [station.latitude, station.longitude],
          16,
          {
            duration: 1.5,
            easeLinearity: 0.25
          }
        );
        
        // Clear the selection after flying
        const timeout = setTimeout(() => {
          setSelectedStation(null);
        }, 2000);
        
        return () => clearTimeout(timeout);
      }
    }, [map, station, setSelectedStation]);
    
    return null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50/80 to-white">
      {/* Navbar with proper z-index */}
      <div className="sticky top-0 z-[100] backdrop-blur-md bg-white/80 border-b border-gray-100">
        <Navbar />
      </div>

      <main className="flex-grow relative">
        {/* Search and Title Section */}
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Find Refill Stations</h1>
            <p className="text-gray-600 mb-8">Search for nearby refill stations and get directions.</p>
            
            {/* Enhanced Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for stations..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                className="w-full pl-12 pr-4 h-12 text-lg rounded-xl shadow-md 
                          border-gray-200 focus:ring-2 focus:ring-refillia-blue/20 
                          focus:border-refillia-blue transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Contained Map Section */}
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border-2 border-blue-100 shadow-lg bg-white">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="animate-pulse text-gray-600">Loading stations...</div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 backdrop-blur-sm">
                <div className="text-red-600">Error loading stations</div>
              </div>
            ) : (
              <div className="h-[70vh] md:h-[600px]">
                <MapContainer
                  center={defaultPosition}
                  zoom={5}
                  className="w-full h-full z-0"
                  whenCreated={(map) => { mapRef.current = map; }}
                >
                  <MapController />
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
                        click: () => {
                          setSelectedStation(station);
                          if (mapRef.current) {
                            // Center the map on the marker with offset for popup
                            mapRef.current.flyTo(
                              [station.latitude + 0.001, station.longitude],
                              16,
                              {
                                duration: 1,
                                easeLinearity: 0.25
                              }
                            );
                          }
                        },
                      }}
                    >
                      <Popup
                        className="station-popup"
                        maxWidth={300}
                        autoPan={true}
                        autoPanPadding={[50, 50]}
                      >
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

                  {/* Map controller component to handle map interactions */}
                  <MapController />
                </MapContainer>

                {/* Floating Action Button for Location */}
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => {
                    setShowUserLocation(!showUserLocation);
                    if (userPosition && mapRef.current) {
                      mapRef.current.flyTo(userPosition, 15, {
                        duration: 1.5
                      });
                    }
                  }}
                  className="absolute bottom-6 right-6 rounded-full w-12 h-12 shadow-lg
                            bg-white hover:bg-refillia-blue text-refillia-blue hover:text-white
                            border border-gray-200 transform transition-all duration-200
                            hover:scale-110 focus:outline-none focus:ring-2 focus:ring-refillia-blue
                            focus:ring-offset-2 z-[90]"
                >
                  <MapPin className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FindStations;
