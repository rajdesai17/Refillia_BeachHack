import { useState } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Update the Reward interface to include image
interface Reward {
  id: string;
  name: string;
  points: number;
  description: string;
  image: string;
}

// Add these interfaces after the Reward interface
interface AddressForm {
  fullName: string;
  streetAddress: string;
  apartment: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

// Update the constantReward to include the image path
const constantReward: Reward = {
  id: "1",
  name: "Steel Water Bottle",
  points: 500,
  description: "A high-quality steel water bottle to keep you hydrated.",
  image: "/img.png" // Assuming the image is in the public folder
};

const RedeemRewards = () => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [address, setAddress] = useState(""); // Add this line for address state
  const { profile } = useAuth(); // Add this line to get profile from auth context
  const { toast } = useToast();

  // Update the component state
  const [addressForm, setAddressForm] = useState<AddressForm>({
    fullName: '',
    streetAddress: '',
    apartment: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });

  // Ensure profile exists before accessing it
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-16">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Loading...</h1>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleRedeem = async (reward: Reward) => {
    if (!profile?.id) return;

    if (profile.points < reward.points) {
      toast({
        title: 'Insufficient Points',
        description: 'You do not have enough points to redeem this reward.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Simulate updating user points and marking the reward as claimed
      // In a real application, you would update the database here

      toast({
        title: 'Reward Redeemed!',
        description: `You have successfully redeemed ${reward.name}.`,
      });

      // Show address form
      setShowAddressForm(true);

      // Simulate refreshing user profile to show updated points
      // In a real application, you would fetch the updated profile here
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast({
        title: 'Error',
        description: 'Failed to redeem reward. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddressSubmit = () => {
    // Validate required fields
    const requiredFields = ['fullName', 'streetAddress', 'city', 'state', 'pincode', 'phone'];
    const missingFields = requiredFields.filter(field => !addressForm[field as keyof AddressForm]);
    
    if (missingFields.length > 0) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
  
    // TODO: Add address submission logic here
    toast({
      title: 'Address Submitted',
      description: 'Your delivery details have been saved.',
    });
    setShowAddressForm(false);
    
    // Reset form
    setAddressForm({
      fullName: '',
      streetAddress: '',
      apartment: '',
      city: '',
      state: '',
      pincode: '',
      phone: ''
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Redeem Rewards</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card key={constantReward.id} className="shadow-lg flex flex-col">
              <CardHeader className="p-0">
                <div className="relative w-full aspect-square">
                  <img
                    src={constantReward.image}
                    alt={constantReward.name}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
                <div className="p-6">
                  <CardTitle className="text-xl">{constantReward.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{constantReward.description}</p>
                <p className="text-lg font-bold text-gray-900 mb-4">{constantReward.points} Points</p>
                <Button
                  onClick={() => handleRedeem(constantReward)}
                  disabled={profile.points < constantReward.points}
                  className="w-full"
                >
                  {profile.points >= constantReward.points ? 'Redeem' : 'Not Enough Points'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />

      {/* Address Form Dialog */}
      <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Delivery Details</DialogTitle>
            <DialogDescription>
              Please provide your delivery information to receive your reward.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    fullName: e.target.value
                  }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    phone: e.target.value
                  }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  placeholder="Enter your street address"
                  value={addressForm.streetAddress}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    streetAddress: e.target.value
                  }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="apartment">Apartment, Suite, etc. (optional)</Label>
                <Input
                  id="apartment"
                  placeholder="Apartment, suite, unit, etc."
                  value={addressForm.apartment}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    apartment: e.target.value
                  }))}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm(prev => ({
                      ...prev,
                      city: e.target.value
                    }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="Enter state"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm(prev => ({
                      ...prev,
                      state: e.target.value
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pincode">PIN Code</Label>
                <Input
                  id="pincode"
                  placeholder="Enter PIN code"
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    pincode: e.target.value
                  }))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddressForm(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddressSubmit}
              className="bg-refillia-blue hover:bg-refillia-darkBlue"
            >
              Confirm & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RedeemRewards;