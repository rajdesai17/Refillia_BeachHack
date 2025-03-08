import { useState, useEffect } from "react";
import { Check, X, MapPin, Search, Edit, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  username: string;
  email: string;
}

interface StationWithProfile extends RefillStation {
  user_profiles: UserProfile;
}

// Update the interface to correctly type the joined data
interface PendingStation {
  id: string;
  name: string;
  description: string;
  landmark: string | null;
  status: 'verified' | 'unverified' | 'reported';
  latitude: number;
  longitude: number;
  added_by: string;
  created_at: string;
  updated_at: string;
  opening_time?: string | null;
  closing_time?: string | null;
  days?: string | null;
  water_level?: string | null;
  contact?: string | null;
  user_profiles: {
    username: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StationWithProfile[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [unverifiedRequests, setUnverifiedRequests] = useState([]);
  const [stationToDelete, setStationToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    console.log('Searching for:', query);
    
    const { data, error } = await supabase
      .from('refill_stations')
      .select(`
        *,
        user_profiles(username, email)
      `)
      .ilike('name', `%${query}%`);

    if (error) {
      console.error('Error searching stations:', error);
      return;
    }

    console.log('Search results:', data);
    
    // Transform the data to match StationWithProfile type
    const transformedData = (data || []).map(station => ({
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
      user_profiles: {
        username: station.user_profiles?.username || "Unknown",
        email: station.user_profiles?.email || "Unknown"
      }
    }));

    setSearchResults(transformedData);

    // If there's exactly one match, zoom to its location
    if (transformedData.length === 1) {
      const station = transformedData[0];
      openGoogleMaps(station.latitude, station.longitude);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fetch all pending station requests
  const fetchPendingStations = async (): Promise<PendingStation[]> => {
    console.log('Fetching pending stations...');
    const { data, error } = await supabase
      .from('refill_stations')
      .select(`
        *,
        user_profiles(username, email)
      `)
      .eq('status', 'unverified')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching unverified requests:', error);
      throw error;
    }

    console.log('Pending stations:', data);
    return (data || []) as PendingStation[];
  };

  // Update the fetchVerifiedStations function
  const fetchVerifiedStations = async () => {
    console.log('Fetching verified stations...');
    
    const { data, error } = await supabase
      .from('refill_stations')
      .select(`
        id,
        name,
        description,
        landmark,
        status,
        latitude,
        longitude,
        added_by,
        created_at,
        updated_at,
        user_profiles (
          username,
          email
        )
      `)
      .eq('status', 'verified')
      .order('updated_at', { ascending: false })
      .limit(50); // Limit results for better performance
    
    if (error) {
      console.error('Error fetching verified stations:', error);
      throw error;
    }
  
    return (data || []).map(station => ({
      id: station.id,
      name: station.name,
      description: station.description,
      landmark: station.landmark,
      status: station.status,
      latitude: station.latitude,
      longitude: station.longitude,
      addedBy: station.added_by,
      createdAt: station.created_at,
      updatedAt: station.updated_at,
      username: station.user_profiles?.username || "Unknown",
      userEmail: station.user_profiles?.email || "No Email"
    }));
  };

  const fetchUnverifiedStations = async () => {
    const { data, error } = await supabase
      .from('refill_stations')
      .select('*')
      .eq('status', 'unverified')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching unverified requests:', error);
      throw error;
    }

    return data;
  };

  const approveStation = async (stationId) => {
    const { data, error } = await supabase
      .from('refill_stations')
      .update({ status: 'verified' })
      .eq('id', stationId);

    if (error) {
      console.error('Error approving station:', error);
      throw error;
    }

    // Refresh the list of stations
    fetchUnverifiedStations();
    fetchVerifiedStations();
  };

  const {
    data: pendingStations = [],
    isLoading: isPendingLoading,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['pendingStations'],
    queryFn: fetchPendingStations,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const { 
    data: verifiedStations = [], 
    isLoading: isVerifiedLoading,
    refetch: refetchVerified
  } = useQuery({
    queryKey: ['verifiedStations'],
    queryFn: fetchVerifiedStations,
    staleTime: 0,
    cacheTime: 0,
    refetchInterval: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2
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
    station.user_profiles?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.user_profiles?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      console.log(`Attempting to update station ${stationId} to status: ${newStatus}`);
      
      // First, verify the station exists
      const { data: existingStation, error: fetchError } = await supabase
        .from('refill_stations')
        .select('*')
        .eq('id', stationId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching station:', fetchError);
        throw new Error('Could not find the station to update');
      }

      console.log('Found station to update:', existingStation);

      // Update the station status
      const { data: updatedStation, error: updateError } = await supabase
        .from('refill_stations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', stationId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating station:', updateError);
        throw updateError;
      }

      console.log('Station updated successfully:', updatedStation);
      
      // Show success message
      toast({
        title: `Station ${newStatus}`,
        description: `The refill station has been ${newStatus} successfully.`,
      });
      
      // Force refetch all data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pendingStations'] }),
        queryClient.invalidateQueries({ queryKey: ['verifiedStations'] }),
        queryClient.invalidateQueries({ queryKey: ['verifiedRefillStations'] })
      ]);

      // Wait for refetch to complete
      await Promise.all([
        refetchPending(),
        refetchVerified()
      ]);

      // Double-check the update
      const { data: verifyUpdate, error: verifyError } = await supabase
        .from('refill_stations')
        .select('*')
        .eq('id', stationId)
        .single();
      
      if (verifyError) {
        console.error('Error verifying update:', verifyError);
      } else {
        console.log('Verified update:', verifyUpdate);
        if (verifyUpdate.status !== newStatus) {
          console.error('Status mismatch after update:', {
            expected: newStatus,
            actual: verifyUpdate.status
          });
        }
      }
      
    } catch (error) {
      console.error(`Error ${newStatus} station:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${newStatus} the station. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Update the handleDelete function
  const handleDelete = async (stationId: string) => {
    try {
      setUpdatingId(stationId);

      // Delete related data first
      await Promise.all([
        supabase.from('feedback').delete().eq('station_id', stationId),
        supabase.from('refill_activities').delete().eq('station_id', stationId)
      ]);

      // Delete the station itself
      const { error: stationError } = await supabase
        .from('refill_stations')
        .delete()
        .eq('id', stationId);

      if (stationError) throw stationError;

      // Immediately update local state
      setVerifiedStations(prev => prev.filter(s => s.id !== stationId));
      setSearchResults(prev => prev.filter(s => s.id !== stationId));

      // Force reset all query caches
      queryClient.resetQueries();
      
      // Reload the page after a short delay
      toast({
        title: "Success",
        description: "Station has been permanently deleted. Refreshing data...",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error deleting station:', error);
      toast({
        title: "Error",
        description: "Failed to delete the station. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
      setStationToDelete(null);
    }
  };

  const openGoogleMaps = (latitude: number, longitude: number) => {
    window.open(
      `https://www.google.com/maps?q=${latitude},${longitude}&z=15`,
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

            {/* Show search results if any */}
            {searchQuery && searchResults.length > 0 && (
              <div className="mb-4 p-4 bg-white rounded-lg shadow">
                <h3 className="text-sm font-medium mb-2">Search Results:</h3>
                <div className="space-y-2">
                  {searchResults.map((station) => (
                    <div 
                      key={station.id} 
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                    >
                      <div>
                        <p className="font-medium">{station.name}</p>
                        <p className="text-sm text-gray-500">{station.landmark || 'No landmark'}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openGoogleMaps(
                          parseFloat(station.latitude.toString()),
                          parseFloat(station.longitude.toString())
                        )}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        View on Map
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show "No results found" message when search has no matches */}
            {searchQuery && searchResults.length === 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-500">No stations found matching "{searchQuery}"</p>
              </div>
            )}

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
                              <span>{station.user_profiles?.username || "Unknown User"}</span>
                              <span className="text-xs text-gray-500">{station.user_profiles?.email || "No Email"}</span>
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
              <div className="bg-white rounded-lg p-8">
                <div className="flex items-center justify-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-refillia-blue"></div>
                  <p className="text-gray-600">Loading verified stations...</p>
                </div>
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
                        <TableHead>Actions</TableHead>
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
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openGoogleMaps(station.latitude, station.longitude)}
                                className="flex items-center gap-1"
                              >
                                <MapPin className="h-3 w-3" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-400 text-blue-500 hover:bg-blue-50"
                                onClick={() => navigate(`/admin/edit-station/${station.id}`)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-400 text-red-500 hover:bg-red-50"
                                onClick={() => {
                                  setStationToDelete(station.id);
                                }}
                                disabled={updatingId === station.id}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
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
        </div>
      </main>
      <Footer />

      <AlertDialog open={!!stationToDelete} onOpenChange={() => setStationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <span>
                  This action cannot be undone. This will permanently delete the refill station
                  and remove all associated data including:
                </span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>User feedback and ratings</li>
                  <li>Refill activities and statistics</li>
                  <li>Location data and details</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!updatingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => stationToDelete && handleDelete(stationToDelete)}
              disabled={!!updatingId}
            >
              {updatingId === stationToDelete ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  <span>Deleting...</span>
                </div>
              ) : (
                'Delete Station'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
