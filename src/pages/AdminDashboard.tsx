import { useState, useEffect } from "react";
import { Check, X, MapPin, Search } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RefillStation } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [unverifiedRequests, setUnverifiedRequests] = useState([]);
  const queryClient = useQueryClient();

  // Fetch all pending station requests
  const fetchPendingStations = async () => {
    const { data, error } = await supabase
      .from('refill_stations')
      .select('*')
      .eq('status', 'unverified')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching unverified requests:', error);
      throw error;
    }

    return (data || []).map(station => ({
      id: station.id,
      name: station.name,
      description: station.description,
      landmark: station.landmark,
      status: station.status as 'verified' | 'unverified' | 'reported',
      latitude: parseFloat(station.latitude.toString()),
      longitude: parseFloat(station.longitude.toString()),
      added_by: station.added_by,
      created_at: station.created_at,
      updated_at: station.updated_at,
      username: "Unknown", // Default value since we can't join with user_profiles
      userEmail: "Unknown" // Default value since we can't join with user_profiles
    }));
  };

  // Fetch verified stations for reference
  const fetchVerifiedStations = async () => {
    const { data, error } = await supabase
      .from('refill_stations')
      .select('*')
      .eq('status', 'verified')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching verified stations:', error);
      throw error;
    }
    
    return (data || []).map(station => ({
      id: station.id,
      name: station.name,
      description: station.description,
      landmark: station.landmark,
      status: station.status as 'verified' | 'unverified' | 'reported',
      latitude: parseFloat(station.latitude.toString()),
      longitude: parseFloat(station.longitude.toString()),
      added_by: station.added_by,
      username: "Unknown", // Default value since we can't join with user_profiles
      userEmail: "Unknown", // Default value since we can't join with user_profiles
      createdAt: new Date(station.created_at).toLocaleString(),
      updatedAt: station.updated_at
    }));
  };

  const { 
    data: pendingStations = [], 
    isLoading: isPendingLoading,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['pendingStations'],
    queryFn: fetchPendingStations
  });

  const { 
    data: verifiedStations = [], 
    isLoading: isVerifiedLoading,
    refetch: refetchVerified,
  } = useQuery({
    queryKey: ['verifiedStations'],
    queryFn: fetchVerifiedStations
  });

  useEffect(() => {
    if (isAdmin) {
      const fetchUnverifiedRequests = async () => {
        const { data, error } = await supabase
          .from('refill_stations')
          .select('*')
          .eq('status', 'unverified')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching unverified requests:', error);
        } else {
          setUnverifiedRequests(data);
        }
      };

      fetchUnverifiedRequests();
    }
  }, [isAdmin]);

  // Filter stations based on search query
  const filteredPending = pendingStations.filter(station => 
    searchQuery === "" || 
    station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (station.landmark && station.landmark.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredVerified = verifiedStations.filter(station => 
    searchQuery === "" || 
    station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (station.landmark && station.landmark.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle verification or rejection of a station
  const handleUpdateStatus = async (stationId: string, newStatus: 'verified' | 'rejected') => {
    setUpdatingId(stationId);
    
    try {
      // Update the station status in Supabase
      const { error } = await supabase
        .from('refill_stations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', stationId);
      
      if (error) {
        console.error(`Error updating station status:`, error);
        throw error;
      }
      
      // Show success message
      toast({
        title: `Station ${newStatus}`,
        description: `The refill station has been ${newStatus} successfully.`,
      });
      
      // Manually refetch data to ensure UI is updated
      await refetchPending();
      await refetchVerified();
      
      // Force a reload of the verified stations in FindStations component
      // by invalidating the cache for the 'verifiedRefillStations' query
      queryClient.invalidateQueries({ queryKey: ['verifiedRefillStations'] });
      
    } catch (error) {
      console.error(`Error ${newStatus} station:`, error);
      toast({
        title: "Error",
        description: `Failed to ${newStatus} the station. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openGoogleMaps = (latitude: number, longitude: number) => {
    window.open(
      `https://www.google.com/maps?q=${latitude},${longitude}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Pending Approval Stations</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search stations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isPendingLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-refillia-blue mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading pending stations...</p>
              </div>
            ) : filteredPending.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">No pending stations found</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Landmark</TableHead>
                        <TableHead>Added By</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPending.map((station) => (
                        <TableRow key={station.id}>
                          <TableCell className="font-medium">{station.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{station.description}</TableCell>
                          <TableCell>{station.landmark || "-"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{station.username || "Unknown"}</span>
                              <span className="text-xs text-gray-500">{station.userEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell>{station.created_at ? new Date(station.created_at).toLocaleString() : "-"}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openGoogleMaps(station.latitude, station.longitude)}
                              className="flex items-center gap-1"
                            >
                              <MapPin className="h-3 w-3" />
                              View
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleUpdateStatus(station.id, 'verified')}
                                disabled={updatingId === station.id}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-400 text-red-500 hover:bg-red-50"
                                onClick={() => handleUpdateStatus(station.id, 'rejected')}
                                disabled={updatingId === station.id}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Verified Stations</h2>
            
            {isVerifiedLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-refillia-blue mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading verified stations...</p>
              </div>
            ) : filteredVerified.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">No verified stations found</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Landmark</TableHead>
                        <TableHead>Added By</TableHead>
                        <TableHead>Verification Date</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVerified.map((station) => (
                        <TableRow key={station.id}>
                          <TableCell className="font-medium">{station.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{station.description}</TableCell>
                          <TableCell>{station.landmark || "-"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{station.username || "Unknown"}</span>
                              <span className="text-xs text-gray-500">{station.userEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell>{station.updatedAt ? new Date(station.updatedAt).toLocaleString() : "-"}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openGoogleMaps(station.latitude, station.longitude)}
                              className="flex items-center gap-1"
                            >
                              <MapPin className="h-3 w-3" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
