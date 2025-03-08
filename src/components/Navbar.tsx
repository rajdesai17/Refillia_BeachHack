import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Droplets, Menu, X, LogOut, UserCircle, Map, Plus, ChevronDown, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const isActive = (path: string) => location.pathname === path;

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    try {
      setIsOpen(false); // Close mobile menu if open
      
      await signOut();
      
      // Toast will be shown on redirect
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMobileSignOut = async () => {
    try {
      setIsOpen(false);
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Find Stations", path: "/find" },
    { name: "Add Station", path: "/add" },
    { name: "Join Us", path: "/join-us" }, // Add Join Us link
    // Only show admin link for admin users
    ...(isAdmin ? [{ name: "Admin Dashboard", path: "/admin" }] : []),
  ];

  return (
    <nav className="bg-white shadow fixed w-full z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Droplets className="h-8 w-8 text-refillia-blue mr-2" />
            <span className="text-xl font-bold text-refillia-darkBlue">Refillia</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(link.path)
                    ? "text-refillia-blue bg-blue-50"
                    : "text-gray-700 hover:text-refillia-blue hover:bg-gray-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* User Menu / Auth Button */}
          <div className="hidden md:flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-1 px-3">
                    <UserCircle className="h-5 w-5 mr-1 text-refillia-blue" />
                    <span className="text-sm font-medium">
                      {profile?.username || user.email?.split("@")[0] || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-500 focus:text-red-500 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                asChild
                className="bg-refillia-blue hover:bg-refillia-darkBlue text-white"
                size="sm"
              >
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-refillia-blue focus:outline-none"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white pb-4 px-4">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(link.path)
                    ? "text-refillia-blue bg-blue-50"
                    : "text-gray-700 hover:text-refillia-blue hover:bg-gray-50"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-gray-200 my-2 pt-2">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-refillia-blue hover:bg-gray-50 flex items-center"
                    onClick={() => setIsOpen(false)}
                  >
                    <UserCircle className="h-5 w-5 mr-2" />
                    My Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-refillia-blue hover:bg-gray-50 flex items-center"
                      onClick={() => setIsOpen(false)}
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleMobileSignOut}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 flex items-center"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-refillia-blue text-white hover:bg-refillia-darkBlue flex items-center justify-center"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
