import { useState } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Reward {
  id: string;
  name: string;
  points: number;
  description: string;
}

const constantReward: Reward = {
  id: "1",
  name: "Steel Water Bottle",
  points: 500,
  description: "A high-quality steel water bottle to keep you hydrated."
};

const RedeemRewards = () => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [address, setAddress] = useState("");
  const { profile } = useAuth();
  const { toast } = useToast();

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
    // Handle address submission logic here
    toast({
      title: 'Coming Soon',
      description: 'Address submission feature is coming soon.',
    });
    setShowAddressForm(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Redeem Rewards</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card key={constantReward.id} className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">{constantReward.name}</CardTitle>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Submit Your Address</DialogTitle>
            <DialogDescription>
              Please provide your address to receive your reward.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full mb-4"
            />
            <Button onClick={handleAddressSubmit} className="w-full">
              Submit
            </Button>
          </div>
          <DialogFooter className="sm:justify-between">
            <div className="text-sm text-gray-500">
              Address submission feature is coming soon.
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RedeemRewards;