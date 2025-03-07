
import { useNavigate } from "react-router-dom";
import { Droplets, MapPin, Plus, User, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-28 pb-16 px-6 bg-gradient-to-b from-refillia-lightBlue to-white">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Find free water refill stations across India
                </h1>
                <p className="text-lg text-gray-700 mb-8">
                  Refillia connects you with nearby water refill stations to reduce plastic waste and provide access to clean drinking water.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="bg-refillia-blue hover:bg-refillia-darkBlue"
                    size="lg"
                    onClick={() => navigate('/find')}
                  >
                    <MapPin className="mr-2 h-5 w-5" />
                    Find Refill Stations
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-refillia-blue text-refillia-blue hover:bg-refillia-lightBlue"
                    size="lg"
                    onClick={() => navigate('/add')}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Refill Station
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <img 
                  src="https://images.unsplash.com/photo-1536939459926-301728717817?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                  alt="Water refill station" 
                  className="rounded-lg shadow-lg max-h-[500px] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-6 bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How Refillia Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<MapPin className="h-10 w-10 text-refillia-blue" />}
                title="Find Stations"
                description="Use our interactive map to locate free water refill stations near you."
              />
              <FeatureCard 
                icon={<Plus className="h-10 w-10 text-refillia-green" />}
                title="Add Stations"
                description="Contribute to the community by adding new refill stations you discover."
              />
              <FeatureCard 
                icon={<ThumbsUp className="h-10 w-10 text-refillia-orange" />}
                title="Give Feedback"
                description="Rate and review stations to help others find the best water sources."
              />
            </div>
          </div>
        </section>

        {/* Impact Stats */}
        <section className="py-16 px-6 bg-refillia-lightBlue">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard value="500+" label="Refill Stations" />
              <StatCard value="10,000+" label="Plastic Bottles Saved" />
              <StatCard value="1,000+" label="Active Users" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6 bg-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Join the Movement
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Start using Refillia today to find free water refill stations, contribute to the community, and reduce plastic waste across India.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                className="bg-refillia-blue hover:bg-refillia-darkBlue"
                size="lg"
                onClick={() => navigate('/find')}
              >
                <MapPin className="mr-2 h-5 w-5" />
                Find Refill Stations
              </Button>
              <Button 
                variant="outline" 
                className="border-refillia-green text-refillia-green hover:bg-green-50"
                size="lg"
                onClick={() => navigate('/profile')}
              >
                <User className="mr-2 h-5 w-5" />
                Create Profile
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center hover:shadow-md transition-all">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

interface StatCardProps {
  value: string;
  label: string;
}

const StatCard = ({ value, label }: StatCardProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm text-center">
      <div className="text-3xl font-bold text-refillia-blue mb-2">{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
};

export default Index;
