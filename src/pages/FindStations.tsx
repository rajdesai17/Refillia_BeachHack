
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPin, Navigation, MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { RefillStation } from "@/types";

// Sample data for demo purposes
const sampleStations: RefillStation[] = [
  {
    id: "1",
    name: "Central Park Fountain",
    description: "Public drinking fountain located near the central playground.",
    status: "verified",
    latitude: 20.5937,
    longitude: 78.9629,
    addedBy: "user123",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "City Hall Water Station",
    description: "Clean drinking water available during office hours.",
    status: "verified",
    latitude: 20.7,
    longitude: 79.1,
    addedBy: "user456",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Railway Station Dispenser",
    description: "Water dispenser located at platform 1.",
    status: "unverified",
    latitude: 20.4,
    longitude: 78.8,
    addedBy: "user789",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448636.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const FindStations = () => {
  const [stations, setStations] = useState<RefillStation[]>(sampleStations);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState<RefillStation | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const { toast } = useToast();
  
  // In a real app, this would fetch from Supabase
  useEffect(() => {
    const fetchStations = async () => {
      setIsLoading(true);
      try {
        // This would be a Supabase query
        // const { data, error } = await supabase.from('refill_stations').select('*');
        // if (error) throw error;
        // setStations(data);
        
        // For now, we just simulate loading
        setTimeout(() => {
          setStations(sampleStations);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching stations:", error);
        toast({
          title: "Error",
          description: "Failed to load refill stations. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchStations();
  }, [toast]);

  // Get user's location if they allow it
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

  const handleGetDirections = (latitude: number, longitude: number) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      "_blank"
    );
  };

  const handleFeedback = (stationId: string, isPositive: boolean) => {
    toast({
      title: "Thank you for your feedback!",
      description: `You ${isPositive ? "liked" : "disliked"} this refill station.`,
    });
    // In a real app, this would submit to Supabase
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Refill Stations</h1>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-[70vh] relative">
              {isLoading ? (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-refillia-blue animate-pulse">Loading map...</div>
                </div>
              ) : (
                <MapContainer
                  center={userPosition || [20.5937, 78.9629]} // Center of India if no user location
                  zoom={13}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {userPosition && <FlyToUserLocation />}

                  {stations.map((station) => (
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
                          <div className="flex items-center mb-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              station.status === 'verified' 
                                ? 'bg-green-100 text-green-800' 
                                : station.status === 'unverified'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {station.status.charAt(0).toUpperCase() + station.status.slice(1)}
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
                </MapContainer>
              )}
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <MapPin className="h-10 w-10 text-refillia-blue mb-4" />
              <h3 className="text-xl font-semibold mb-2">Find Nearby Stations</h3>
              <p className="text-gray-600">
                Click on the map markers to view details about each refill station, including directions.
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

export default FindStations;
