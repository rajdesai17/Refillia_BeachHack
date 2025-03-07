import React from 'react';
import { CheckCircle2, ArrowRight, Users, Store, Globe, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const JoinUsInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Why Join Refillia?</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Partner with us to make a difference by offering free water refills. 
              Join our growing network of sustainable businesses committed to reducing plastic waste.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-refillia-blue hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <Users className="h-10 w-10 text-refillia-blue shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Increased Foot Traffic</h3>
                  <p className="text-gray-600">
                    Attract more visitors to your business as users search for convenient water refill locations. 
                    Our map directs thirsty customers straight to your door.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-refillia-green hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <Store className="h-10 w-10 text-refillia-green shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Free Advertisement</h3>
                  <p className="text-gray-600">
                    Get your business featured on our map and app at no cost. Thousands of users discover 
                    new businesses while looking for places to refill their water bottles.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-refillia-orange hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <Globe className="h-10 w-10 text-refillia-orange shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Sustainability Branding</h3>
                  <p className="text-gray-600">
                    Enhance your brand image as an environmentally conscious business. 
                    Show customers that you're committed to sustainability and reducing plastic waste.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <Award className="h-10 w-10 text-purple-500 shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Community Contribution</h3>
                  <p className="text-gray-600">
                    Make a meaningful impact in your community by helping reduce plastic waste and providing 
                    access to free drinking water for everyone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-refillia-lightBlue rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to make a difference?</h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Join our network of refill stations today and be part of the solution. 
              Registration is quick, free, and your information will be verified by our team before being published.
            </p>
            <Button 
              onClick={() => navigate('/join-us-form')} 
              className="bg-refillia-blue hover:bg-refillia-darkBlue text-white px-8 py-6 rounded-md text-lg font-medium inline-flex items-center"
            >
              Get Started – List Your Refill Station
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-8">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-refillia-blue">1</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Register Your Location</h4>
                <p className="text-gray-600">Fill out our simple form with your business details</p>
              </div>
              
              <div className="text-center">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-refillia-blue">2</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Verification</h4>
                <p className="text-gray-600">Our admin team reviews and approves your registration</p>
              </div>
              
              <div className="text-center">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-refillia-blue">3</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Go Live</h4>
                <p className="text-gray-600">Your refill station appears on our map for users to find</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default JoinUsInfo;