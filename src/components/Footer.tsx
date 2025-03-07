
import { Droplets } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-refillia-lightBlue py-8 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <Droplets className="h-8 w-8 text-refillia-blue" />
              <span className="text-xl font-bold text-refillia-darkBlue">Refillia</span>
            </Link>
            <p className="mt-4 text-gray-600">
              Connecting people with free water refill stations across India.
            </p>
          </div>
          
          <div className="md:col-span-1">
            <h3 className="font-medium text-lg mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-600 hover:text-refillia-blue">Home</Link></li>
              <li><Link to="/find" className="text-gray-600 hover:text-refillia-blue">Find Stations</Link></li>
              <li><Link to="/add" className="text-gray-600 hover:text-refillia-blue">Add Station</Link></li>
              <li><Link to="/profile" className="text-gray-600 hover:text-refillia-blue">Profile</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-1">
            <h3 className="font-medium text-lg mb-4">About</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-refillia-blue">About Us</a></li>
              <li><a href="#" className="text-gray-600 hover:text-refillia-blue">How It Works</a></li>
              <li><a href="#" className="text-gray-600 hover:text-refillia-blue">Contact</a></li>
              <li><a href="#" className="text-gray-600 hover:text-refillia-blue">FAQ</a></li>
            </ul>
          </div>
          
          <div className="md:col-span-1">
            <h3 className="font-medium text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-refillia-blue">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-refillia-blue">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Refillia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
