
import { useState } from "react";
import { User, MapPin, MessageSquare, Award, Edit, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserProfile, RefillStation, Feedback } from "@/types";

// Sample user data for demo purposes
const sampleUser: UserProfile = {
  id: "user123",
  username: "waterwarrior",
  email: "user@example.com",
  points: 150,
  stationsAdded: 3,
  feedbackGiven: 5,
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
};

// Sample stations added by the user
const sampleUserStations: RefillStation[] = [
  {
    id: "1",
    name: "Central Park Fountain",
    description: "Public drinking fountain located near the central playground.",
    status: "verified",
    latitude: 20.5937,
    longitude: 78.9629,
    addedBy: "user123",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "City Hall Water Station",
    description: "Clean drinking water available during office hours.",
    status: "verified",
    latitude: 20.7,
    longitude: 79.1,
    addedBy: "user123",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "Railway Station Dispenser",
    description: "Water dispenser located at platform 1.",
    status: "unverified",
    latitude: 20.4,
    longitude: 78.8,
    addedBy: "user123",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Sample feedback given by the user
const sampleUserFeedback: Feedback[] = [
  {
    id: "1",
    stationId: "5",
    userId: "user123",
    rating: 5,
    comment: "Great water quality and easy to find!",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    stationId: "6",
    userId: "user123",
    rating: 4,
    comment: "Good location but sometimes it's crowded.",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const Profile = () => {
  const [user] = useState<UserProfile>(sampleUser);
  const [userStations] = useState<RefillStation[]>(sampleUserStations);
  const [userFeedback] = useState<Feedback[]>(sampleUserFeedback);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const nextLevel = Math.ceil(user.points / 100) * 100;
  const currentLevelStart = Math.floor(user.points / 100) * 100;
  const progressPercentage = ((user.points - currentLevelStart) / (nextLevel - currentLevelStart)) * 100;
  const userLevel = Math.floor(user.points / 100) + 1;

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

  const handleEditProfile = () => {
    toast({
      title: "Coming Soon",
      description: "Profile editing will be available in a future update.",
    });
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
                  <CardTitle>{user.username}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Level {userLevel}: {getLevelTitle(userLevel)}</span>
                        <span className="text-xs text-muted-foreground">{user.points}/{nextLevel} points</span>
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
                        <span className="font-medium">{user.stationsAdded}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 text-refillia-green mr-2" />
                          <span className="text-sm">Feedback Given</span>
                        </div>
                        <span className="font-medium">{user.feedbackGiven}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 text-refillia-orange mr-2" />
                          <span className="text-sm">Total Points</span>
                        </div>
                        <span className="font-medium">{user.points}</span>
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
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
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
                    {user.stationsAdded >= 3 && (
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
                    {user.points >= 100 && (
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
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                  >
                                    Edit
                                  </Button>
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
                              <p>{formatDate(user.createdAt)}</p>
                            </div>
                            <Separator />
                            <div>
                              <h4 className="text-sm font-medium mb-2">Total Water Saved</h4>
                              <p className="text-2xl font-bold text-refillia-blue">
                                ~{user.stationsAdded * 50} liters
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Based on estimated usage of your added stations
                              </p>
                            </div>
                            <Separator />
                            <div>
                              <h4 className="text-sm font-medium mb-2">Plastic Bottles Saved</h4>
                              <p className="text-2xl font-bold text-refillia-green">
                                ~{user.stationsAdded * 100}
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
                                    {user.points < 200 ? "Hydration Helper" : 
                                     user.points < 300 ? "Refill Ranger" :
                                     user.points < 400 ? "Water Warrior" : "Hydration Hero"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {nextLevel - user.points} points needed
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
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
