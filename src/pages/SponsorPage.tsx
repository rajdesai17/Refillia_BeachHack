import { Droplets, Mail, Phone, Globe, Award, Users, Facebook, Twitter, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";

const SponsorPage = () => {
  const benefits = [
    {
      icon: <Globe className="w-12 h-12 text-refillia-blue" />,
      title: "Global Impact",
      description: "Join our mission to reduce plastic waste worldwide and make clean water accessible to all.",
    },
    {
      icon: <Award className="w-12 h-12 text-refillia-blue" />,
      title: "Brand Recognition",
      description: "Get featured on our platform and gain visibility among environmentally conscious users.",
    },
    {
      icon: <Users className="w-12 h-12 text-refillia-blue" />,
      title: "Community Engagement",
      description: "Connect with a growing community of sustainability advocates and eco-friendly businesses.",
    },
  ];

  const socialLinks = [
    { icon: <Facebook className="w-5 h-5" />, label: "Facebook", url: "https://facebook.com/refillia" },
    { icon: <Twitter className="w-5 h-5" />, label: "Twitter", url: "https://twitter.com/refillia" },
    { icon: <Instagram className="w-5 h-5" />, label: "Instagram", url: "https://instagram.com/refillia" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 pt-28">
        <div className="container mx-auto px-4 text-center">
          <Droplets className="w-16 h-16 text-refillia-blue mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-refillia-darkBlue mb-4">
            Partner with Refillia
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Join us in our mission to create a sustainable future by reducing plastic waste
            and making water refill stations accessible worldwide.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-refillia-blue hover:bg-refillia-darkBlue text-white"
              >
                Become a Sponsor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-refillia-darkBlue mb-4">
                  Let's Make a Difference Together
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <p className="text-gray-600">
                  Thank you for your interest in partnering with Refillia! We're excited to work together
                  towards a more sustainable future. Our team is ready to discuss how we can create meaningful
                  impact together.
                </p>
                <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-refillia-blue" />
                    <span className="text-gray-700">sponsors@refillia.com</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-refillia-blue" />
                    <span className="text-gray-700">+1 (555) 123-4567</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">Connect with us on social media:</p>
                  <div className="flex justify-center space-x-4">
                    {socialLinks.map((social, index) => (
                      <a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-refillia-blue hover:text-refillia-darkBlue transition-colors"
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-refillia-darkBlue mb-12">
            Sponsorship Benefits
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-refillia-darkBlue mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SponsorPage; 