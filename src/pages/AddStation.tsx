import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { MapPin, FileText, AlertTriangle } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Custom marker icon
const customIcon = L.divIcon({
  className: 'simple-marker',
  html: `<div class="marker-dot"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8]
});

const AddStation = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [landmark, setLandmark] = useState("");
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: "",
    description: "",
    position: "",
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
          setUserLocation(userPos);
          
          // If map is loaded, fly to user location
          if (mapRef.current) {
            mapRef.current.flyTo(userPos, 15);
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
  }, [toast]);

  const validateForm = () => {
    let isValid = true;
    const errors = {
      name: "",
      description: "",
      position: "",
    };

    if (!name.trim()) {
      errors.name = "Station name is required";
      isValid = false;
    }

    if (!description.trim()) {
      errors.description = "Description is required";
      isValid = false;
    }

    if (!position) {
      errors.position = "Please select a location on the map";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Form Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to add a refill station.",
          variant: "destructive",
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
        status: 'unverified',
        added_by: user.id,
      }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Refill station added successfully. Thank you for your contribution!",
      });

      setName("");
      setDescription("");
      setLandmark("");
      setPosition(null);
      setFormErrors({ name: "", description: "", position: "" });

      setTimeout(() => {
        navigate('/find');
      }, 2000);
    } catch (error) {
      console.error("Error submitting station:", error);
      toast({
        title: "Error",
        description: "Failed to add refill station. Please try again.",
        variant: "destructive",
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

  const UserLocationMarker = () => {
    const map = useMapEvents({
      load: () => {
        if (userLocation) {
          map.flyTo(userLocation, 15);
        }
      }
    });

    return userLocation ? (
      <Marker 
        position={userLocation} 
        icon={L.divIcon({
          className: 'user-location-marker',
          html: `<div class="user-location-dot"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })}
      />
    ) : null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Add a Refill Station</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Map Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-[60vh]">
                <MapContainer
                  center={userLocation || [20.5937, 78.9629]}
                  zoom={userLocation ? 15 : 5}
                  className="h-full w-full"
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker />
                  <UserLocationMarker />
                </MapContainer>
              </div>
              <div className="p-4 bg-refillia-lightBlue">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-refillia-blue mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Click on the map to select the exact location of the refill station. Your current location is shown with a blue marker.
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
                      className={formErrors.name ? "border-red-500" : ""}
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
                      className={formErrors.description ? "border-red-500" : ""}
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
                    <Label htmlFor="location">Selected Location</Label>
                    <Input
                      id="location"
                      readOnly
                      value={
                        position
                          ? `Latitude: ${position[0].toFixed(6)}, Longitude: ${position[1].toFixed(
                              6
                            )}`
                          : "No location selected"
                      }
                      className={`bg-gray-50 ${formErrors.position ? "border-red-500" : ""}`}
                    />
                    {formErrors.position && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.position}</p>
                    )}
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-md">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                      Please ensure that the information you provide is accurate. Submitting false information may result in your contribution being removed.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-refillia-blue hover:bg-refillia-darkBlue"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Refill Station"}
                  </Button>
                </div>
              </form>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-refillia-green mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">Guidelines</h3>
                    <ul className="text-sm text-gray-600 list-disc pl-5 mt-1 space-y-1">
                      <li>Only add publicly accessible water refill stations</li>
                      <li>Be as specific as possible in your description</li>
                      <li>Include information about operating hours if applicable</li>
                      <li>Mention any restrictions or requirements</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Why Add Refill Stations?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-refillia-lightBlue p-4 rounded-full mb-4">
                  <MapPin className="h-8 w-8 text-refillia-blue" />
                </div>
                <h3 className="font-medium mb-2">Help Others</h3>
                <p className="text-gray-600 text-sm">
                  By adding refill stations, you help others find clean drinking water easily.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-50 p-4 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-refillia-green" />
                </div>
                <h3 className="font-medium mb-2">Reduce Plastic Waste</h3>
                <p className="text-gray-600 text-sm">
                  Each refill station you add helps reduce single-use plastic bottle consumption.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-orange-50 p-4 rounded-full mb-4">
                  <svg className="h-8 w-8 text-refillia-orange" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-medium mb-2">Earn Reward Points</h3>
                <p className="text-gray-600 text-sm">
                  Get points for every verified station you add, which can be displayed on your profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AddStation;
