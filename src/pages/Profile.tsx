import { useState } from "react";
import { User, MapPin, MessageSquare, Award, Edit, LogOut, Plus, Droplets, Droplet, Gift } from "lucide-react"; // Update this line
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { RefillStation, Feedback } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  points: number;
  stationsAdded: number;
  feedbackGiven: number;
  createdAt: string;
  bottlesSaved: number; // Add this field
}

interface DatabaseStation {
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
  user_profiles: UserProfile;
}

interface StationWithProfile extends DatabaseStation {
  user_profiles: UserProfile;
  opening_time?: string | null; // Add this line
}

interface PendingStation extends DatabaseStation {
  username: string;
  userEmail: string;
}

const Profile = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch user's stations
  const { data: userStations = [] } = useQuery({
    queryKey: ['userStations', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('refill_stations')
        .select(`
          *,
          user_profiles!inner(username, email)
        `)
        .eq('added_by', profile.id)
        .returns<StationWithProfile[]>();
        
      if (error) throw error;
      
      return (data || []).map(station => ({
        id: station.id,
        name: station.name,
        description: station.description,
        landmark: station.landmark,
        status: station.status,
        latitude: parseFloat(station.latitude.toString()),
        longitude: parseFloat(station.longitude.toString()),
        username: station.user_profiles.username,
        userEmail: station.user_profiles.email,
        createdAt: station.created_at,
        updatedAt: station.updated_at,
        opening_time: station.opening_time, // Add this
        addedBy: station.added_by
      }));
    },
    enabled: !!profile?.id
  });
  
  // Fetch user's feedback
  const { data: userFeedback = [] } = useQuery({
    queryKey: ['userFeedback', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', profile.id);
        
      if (error) throw error;
      
      return (data || []).map(feedback => ({
        id: feedback.id,
        stationId: feedback.station_id,
        userId: feedback.user_id,
        rating: feedback.rating,
        comment: feedback.comment || "",
        createdAt: feedback.created_at
      }));
    },
    enabled: !!profile?.id
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      navigate("/");
    } catch (error: Error | unknown) {
      toast({
        title: "Error signing out",
        description: error instanceof Error ? error.message : "An error occurred while signing out",
        variant: "destructive",
      });
    }
  };

  const handleEditProfile = () => {
    toast({
      title: "Coming Soon",
      description: "Profile editing will be available in a future update.",
    });
  };

  if (!profile) {
    return null; // This shouldn't render as ProtectedRoute will redirect
  }

  const nextLevel = Math.ceil((profile?.points || 0) / 100) * 100;
  const currentLevelStart = Math.floor((profile?.points || 0) / 100) * 100;
  const progressPercentage = ((profile?.points || 0) - currentLevelStart) / (nextLevel - currentLevelStart) * 100;
  const userLevel = Math.floor((profile?.points || 0) / 100) + 1;

  // Get level title based on points
  const getLevelTitle = (level: number) => {
    const titles = [
      "Water Rookie",
      "Hydration Helper",
      "Refill Ranger",
      "Water Warrior",
      "Hydration Hero"
    ];
    
    if (level <= 1) return titles[0];
    if (level <= 2) return titles[1];
    if (level <= 3) return titles[2];
    if (level <= 4) return titles[3];
    return titles[4];
  };

  const fetchPendingStations = async (): Promise<PendingStation[]> => {
    const { data, error } = await supabase
      .from('refill_stations')
      .select(`
        *,
        user_profiles!inner(username, email)
      `)
      .eq('status', 'unverified')
      .order('created_at', { ascending: false })
      .returns<StationWithProfile[]>();

    if (error) {
      console.error('Error fetching unverified requests:', error);
      throw error;
    }

    return data.map(station => ({
      ...station,
      username: station.user_profiles.username,
      userEmail: station.user_profiles.email,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - User Info */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-4">
                    <div className="bg-refillia-lightBlue p-4 rounded-full">
                      <User className="h-16 w-16 text-refillia-blue" />
                    </div>
                  </div>
                  <CardTitle>{profile.username}</CardTitle>
                  <CardDescription>{profile.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Level {userLevel}: {getLevelTitle(userLevel)}</span>
                        <span className="text-xs text-muted-foreground">{profile.points}/{nextLevel} points</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-refillia-blue mr-2" />
                          <span className="text-sm">Stations Added</span>
                        </div>
                        <span className="font-medium">{profile.stationsAdded}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 text-refillia-green mr-2" />
                          <span className="text-sm">Feedback Given</span>
                        </div>
                        <span className="font-medium">{profile.feedbackGiven}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 text-refillia-orange mr-2" />
                          <span className="text-sm">Total Points</span>
                        </div>
                        <span className="font-medium">{profile.points}</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="pt-2 flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={handleEditProfile}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-green-500 hover:text-green-600 hover:bg-green-50"
                        onClick={() => navigate('/redeem-rewards')}
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Redeem Rewards
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-refillia-lightBlue p-2 rounded-full">
                        <MapPin className="h-5 w-5 text-refillia-blue" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">First Station</h4>
                        <p className="text-xs text-muted-foreground">Added your first refill station</p>
                      </div>
                    </div>
                    {profile.stationsAdded >= 3 && (
                      <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2 rounded-full">
                          <MapPin className="h-5 w-5 text-refillia-green" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Water Provider</h4>
                          <p className="text-xs text-muted-foreground">Added 3+ refill stations</p>
                        </div>
                      </div>
                    )}
                    {profile.points >= 100 && (
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-50 p-2 rounded-full">
                          <Award className="h-5 w-5 text-refillia-orange" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Century Club</h4>
                          <p className="text-xs text-muted-foreground">Earned 100+ points</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="stations">
                <TabsList>
                  <TabsTrigger value="stations">My Stations ({userStations.length})</TabsTrigger>
                  <TabsTrigger value="feedback">My Feedback ({userFeedback.length})</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                  <TabsContent value="stations">
                    {userStations.length > 0 ? (
                      <div className="space-y-4">
                        {userStations.map((station) => (
                          <Card key={station.id}>
                            <CardContent className="pt-6">
                              <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-lg">{station.name}</h3>
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
                                  <p className="text-gray-600 mb-2">{station.description}</p>
                                  <div className="text-sm text-muted-foreground">
                                    Added on {formatDate(station.createdAt)}
                                  </div>
                                </div>
                                <div className="flex flex-row md:flex-col gap-2 justify-end">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="border-refillia-blue text-refillia-blue hover:bg-refillia-lightBlue"
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`, '_blank')}
                                  >
                                    View on Map
                                  </Button>
                                  {/* Only show edit button if:
    1. Station is verified
    2. Station was added by the current user
    3. Station has opening_time (indicating it came from JoinUs form) */}
{station.status === 'verified' && 
 station.addedBy === profile?.id && 
 station.opening_time && (
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => navigate(`/edit-station/${station.id}`)}
  >
    Edit
  </Button>
)}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Stations Added Yet</h3>
                        <p className="text-muted-foreground mb-6">You haven't added any refill stations yet.</p>
                        <Button 
                          onClick={() => window.location.href = '/add'}
                          className="bg-refillia-blue hover:bg-refillia-darkBlue"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Your First Station
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="feedback">
                    {userFeedback.length > 0 ? (
                      <div className="space-y-4">
                        {userFeedback.map((feedback) => (
                          <Card key={feedback.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex gap-1 mb-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <svg 
                                        key={i}
                                        className={`h-4 w-4 ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                      </svg>
                                    ))}
                                  </div>
                                  <p className="text-gray-600 mb-2">{feedback.comment}</p>
                                  <div className="text-sm text-muted-foreground">
                                    Submitted on {formatDate(feedback.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Feedback Given Yet</h3>
                        <p className="text-muted-foreground mb-6">You haven't provided feedback for any refill stations yet.</p>
                        <Button 
                          onClick={() => window.location.href = '/find'}
                          className="bg-refillia-blue hover:bg-refillia-darkBlue"
                        >
                          Find Stations
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="stats">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Activity Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Member Since</h4>
                              <p>{formatDate(profile.createdAt)}</p>
                            </div>
                            <Separator />
                            
                            <div>
                              <h4 className="text-sm font-medium mb-2">Plastic Bottles Saved</h4>
                              <p className="text-2xl font-bold text-refillia-green">
                                ~{profile.stationsAdded * 100}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Estimated based on average station usage
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Impact Rewards</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="bg-refillia-lightBlue rounded-lg p-4">
                              <h4 className="font-medium mb-2">How to Earn More Points</h4>
                              <ul className="text-sm space-y-2">
                                <li className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-refillia-blue mt-0.5 flex-shrink-0" />
                                  <span>Add a new refill station (50 points)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <MessageSquare className="h-4 w-4 text-refillia-green mt-0.5 flex-shrink-0" />
                                  <span>Submit feedback on a station (10 points)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Award className="h-4 w-4 text-refillia-orange mt-0.5 flex-shrink-0" />
                                  <span>Get your station verified (25 bonus points)</span>
                                </li>
                              </ul>
                            </div>
                            
                            <div className="pt-2">
                              <h4 className="text-sm font-medium mb-2">Next Milestone</h4>
                              <div className="flex items-center gap-3 p-3 border rounded-md">
                                <Award className="h-6 w-6 text-refillia-orange" />
                                <div>
                                  <p className="font-medium">
                                    {profile.points < 200 ? "Hydration Helper" : 
                                     profile.points < 300 ? "Refill Ranger" :
                                     profile.points < 400 ? "Water Warrior" : "Hydration Hero"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {nextLevel - profile.points} points needed
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <Card className="shadow-lg">
    <CardContent className="flex flex-col items-center pt-6">
      <Award className="h-12 w-12 text-amber-400 mb-4" />
      <p className="text-4xl font-bold text-gray-900">{profile?.points || 0}</p>
      <p className="text-lg text-gray-600">Total Points</p>
    </CardContent>
  </Card>
  
  <Card className="shadow-lg">
    <CardContent className="flex flex-col items-center pt-6">
      <Droplets className="h-12 w-12 text-refillia-blue mb-4" />
      <p className="text-4xl font-bold text-gray-900">{profile?.bottlesSaved || 0}</p>
      <p className="text-lg text-gray-600">Plastic Bottles Saved</p>
    </CardContent>
  </Card>
  
  <Card className="shadow-lg">
    <CardContent className="flex flex-col items-center pt-6">
      <MapPin className="h-12 w-12 text-refillia-green mb-4" />
      <p className="text-4xl font-bold text-gray-900">{userStations.length}</p>
      <p className="text-lg text-gray-600">Stations Added</p>
    </CardContent>
  </Card>
  
  <Card className="shadow-lg">
    <CardContent className="flex flex-col items-center pt-6">
      <MessageSquare className="h-12 w-12 text-refillia-orange mb-4" />
      <p className="text-4xl font-bold text-gray-900">{profile?.feedbackGiven || 0}</p>
      <p className="text-lg text-gray-600">Feedback Given</p>
    </CardContent>
  </Card>
</div>

                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
