import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPin, Navigation, MessageCircle, ThumbsUp, ThumbsDown, Search } from "lucide-react";
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

// Fix for Leaflet marker icon
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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
  const [selectedStation, setSelectedStation] = useState<RefillStation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
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
      updatedAt: station.updated_at
    }));
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

  const handleGetDirections = (latitude: number, longitude: number) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      "_blank"
    );
  };

  const handleFeedback = async (stationId: string, isPositive: boolean) => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to provide feedback.",
          variant: "destructive",
        });
        return;
      }

      // Submit feedback to Supabase
      const { error } = await supabase.from('feedback').insert([{
        station_id: stationId,
        user_id: user.id,
        rating: isPositive ? 5 : 1,
        comment: isPositive ? "Helpful" : "Issue reported"
      }]);

      if (error) throw error;

      toast({
        title: "Thank you for your feedback!",
        description: `You ${isPositive ? "liked" : "reported an issue with"} this refill station.`,
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Component to fly to user's location
  const FlyToUserLocation = () => {
    const map = useMap();
    
    useEffect(() => {
      if (userPosition) {
        map.flyTo(userPosition, 13);
      }
    }, [map, userPosition]);
    
    return null;
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim() === "") return;
    
    const foundStation = stations.find(station => 
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (station.landmark && station.landmark.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    if (foundStation) {
      setSelectedStation(foundStation);
      // This will trigger the map to fly to the station in MapContainer
    } else {
      toast({
        title: "No results found",
        description: `Could not find any stations matching "${searchQuery}"`,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Find Refill Stations</h1>
            
            <form onSubmit={handleSearch} className="w-full md:w-auto">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by name or landmark..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 w-full md:w-64"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  variant="ghost" 
                  className="absolute right-0 top-0 h-full"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-[70vh] relative">
              {isLoading ? (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-refillia-blue animate-pulse">Loading map...</div>
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-red-500">Error loading stations. Please try again.</div>
                </div>
              ) : (
                <MapContainer
                  center={userPosition || defaultPosition}
                  zoom={13}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {userPosition && (
                    <>
                      <FlyToUserLocation />
                      <Marker position={userPosition} icon={userIcon}>
                        <Popup>
                          <div className="p-1">
                            <h3 className="font-semibold text-gray-900">Your Location</h3>
                          </div>
                        </Popup>
                      </Marker>
                    </>
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
                        <div className="p-1">
                          <h3 className="font-semibold text-gray-900">{station.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{station.description}</p>
                          {station.landmark && (
                            <p className="text-xs text-gray-500 mb-2">
                              <strong>Landmark:</strong> {station.landmark}
                            </p>
                          )}
                          <div className="flex items-center mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              Verified
                            </span>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              className="bg-refillia-blue hover:bg-refillia-darkBlue w-full"
                              onClick={() => handleGetDirections(station.latitude, station.longitude)}
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
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <MapPin className="h-10 w-10 text-refillia-blue mb-4" />
              <h3 className="text-xl font-semibold mb-2">Find Nearby Stations</h3>
              <p className="text-gray-600">
                Click on the map markers to view details about each verified refill station, including directions.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <Navigation className="h-10 w-10 text-refillia-green mb-4" />
              <h3 className="text-xl font-semibold mb-2">Get Directions</h3>
              <p className="text-gray-600">
                Use the "Get Directions" button to navigate to your chosen refill station using Google Maps.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <MessageCircle className="h-10 w-10 text-refillia-orange mb-4" />
              <h3 className="text-xl font-semibold mb-2">Give Feedback</h3>
              <p className="text-gray-600">
                Let others know about the condition of refill stations by providing feedback.
              </p>
            </div>
          </div>
        </div>
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
