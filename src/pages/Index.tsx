import { useNavigate } from "react-router-dom";
import { Droplets, MapPin, Plus, User, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client"; // Update this line

const Index = () => {
  const navigate = useNavigate();
  const [impactStats, setImpactStats] = useState({
    totalBottlesSaved: 0,
    totalRefills: 0
  });

  useEffect(() => {
    const fetchImpactStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_global_impact_stats');
        
        if (error) throw error;
        
        if (data) {
          setImpactStats({
            totalBottlesSaved: data.total_bottles_saved || 0,
            totalRefills: data.total_refills || 0
          });
        }
      } catch (error) {
        console.error('Error fetching impact stats:', error);
      }
    };
    
    fetchImpactStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-gradient-to-b from-refillia-lightBlue via-blue-50 to-white text-center">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute waves-bg animate-wave"></div>
          </div>
          <div className="container mx-auto relative z-10">
            <div className="flex flex-col items-center">
              <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 animate-fade-in tracking-tight leading-none">
                Find Free Water Refill Stations Across India
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-10 animate-fade-in-delay max-w-3xl mx-auto leading-relaxed">
                Refillia connects you with nearby water refill stations to reduce plastic waste and provide access to clean drinking water.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
                <Button 
                  className="bg-refillia-blue hover:bg-refillia-darkBlue text-lg px-8 py-4 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  size="lg"
                  onClick={() => navigate('/find')}
                >
                  <MapPin className="mr-3 h-6 w-6" />
                  Find Refill Stations
                </Button>
                <Button 
                  variant="outline" 
                  className="border-refillia-blue text-refillia-blue hover:bg-refillia-lightBlue text-lg px-6 py-3"
                  size="lg"
                  onClick={() => navigate('/add')}
                >
                  <Plus className="mr-2 h-6 w-6" />
                  Add Refill Station
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-6 bg-white text-center">
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 animate-fade-in">How Refillia Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<MapPin className="h-12 w-12 text-refillia-blue" />}
                title="Find Stations"
                description="Use our interactive map to locate free water refill stations near you."
              />
              <FeatureCard 
                icon={<Plus className="h-12 w-12 text-refillia-green" />}
                title="Add Stations"
                description="Contribute to the community by adding new refill stations you discover."
              />
              <FeatureCard 
                icon={<ThumbsUp className="h-12 w-12 text-refillia-orange" />}
                title="Give Feedback"
                description="Rate and review stations to help others find the best water sources."
              />
            </div>
          </div>
        </section>

        {/* Community Impact */}
        <section className="py-16 bg-refillia-lightBlue text-center">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold mb-10 animate-fade-in">Our Community Impact</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-8 text-center shadow-md">
                <div className="text-5xl font-bold text-refillia-blue mb-2">
                  {impactStats.totalBottlesSaved.toLocaleString()}
                </div>
                <p className="text-xl text-gray-700">Plastic Bottles Saved</p>
              </div>
              
              <div className="bg-white rounded-lg p-8 text-center shadow-md">
                <div className="text-5xl font-bold text-refillia-green mb-2">
                  {impactStats.totalRefills.toLocaleString()}
                </div>
                <p className="text-xl text-gray-700">Refills Completed</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6 bg-white text-center">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in">
              Join the Movement
            </h2>
            <p className="text-lg text-gray-700 mb-8 animate-fade-in">
              Start using Refillia today to find free water refill stations, contribute to the community, and reduce plastic waste across India.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in">
              <Button 
                className="bg-refillia-blue hover:bg-refillia-darkBlue text-lg px-6 py-3"
                size="lg"
                onClick={() => navigate('/find')}
              >
                <MapPin className="mr-2 h-6 w-6" />
                Find Refill Stations
              </Button>
              <Button 
                variant="outline" 
                className="border-refillia-green text-refillia-green hover:bg-green-50 text-lg px-6 py-3"
                size="lg"
                onClick={() => navigate('/profile')}
              >
                <User className="mr-2 h-6 w-6" />
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
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center 
                    hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 
                    cursor-pointer group">
      <div className="flex justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-semibold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

interface StatCardProps {
  value: string;
  label: string;
}

const StatCard = ({ value, label }: StatCardProps) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md text-center transform hover:scale-105 
                    transition-all duration-300 border border-gray-100 hover:border-refillia-blue">
      <div className="text-4xl font-bold text-refillia-blue mb-3">{value}</div>
      <div className="text-gray-700 font-medium">{label}</div>
    </div>
  );
};

export default Index;
