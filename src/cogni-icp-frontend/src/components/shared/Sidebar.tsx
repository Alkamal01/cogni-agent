import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  BookOpen, 
  MessageSquare, 
  BarChart2,
  Award,
  CreditCard,
  ArrowRight,
  GraduationCap,
  X // For the close button
} from 'lucide-react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Import from react-icons
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../cognilogo.png';
import logo2 from '../../logo2.png';

const sidebarVariants = {
  hidden: { opacity: 0 }, // Removed x: -20
  visible: { 
    opacity: 1,          // Removed x: 0
    transition: { 
      duration: 0.5,
      staggerChildren: 0.1,
      delayChildren: 0.3
    } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  }
};

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const mainNavItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Tutors', icon: GraduationCap, path: '/tutors' },
    { name: 'Study Groups', icon: Users, path: '/groups' },
    { name: 'Studio', icon: BookOpen, path: '/learning-paths' },
    { name: 'Analytics', icon: BarChart2, path: '/analytics' },
    { name: 'Achievements', icon: Award, path: '/achievements' }
  ];

  return (
    <motion.div
      className={`fixed inset-y-0 left-0 z-40 flex-shrink-0 transform transition-all duration-300 ease-in-out 
                  lg:relative lg:translate-x-0 flex
                  ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72 lg:w-20'}`}
      initial="hidden"
      animate="visible" 
      variants={sidebarVariants}
    >
      <div className={`flex flex-col h-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-72' : 'w-full lg:w-20'}`}>
        <div className="flex flex-col h-screen pt-5 pb-4 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg relative overflow-y-auto overflow-x-hidden">
          {/* Decorative background elements */}
          <div className={`absolute top-0 right-0 w-full h-32 bg-gradient-to-r from-primary-500/5 to-purple-500/10 dark:from-primary-900/20 dark:to-purple-900/20 -z-10 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}></div>
          <div className={`absolute bottom-0 left-0 w-full h-32 bg-gradient-to-r from-primary-500/5 to-purple-500/10 dark:from-primary-900/20 dark:to-purple-900/20 -z-10 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}></div>
          
          {/* Header with Logo, Title, and Collapse/Expand Buttons */}
          <div className="flex items-center justify-between flex-shrink-0 px-4 mb-8">
            <motion.div 
              variants={itemVariants}
              className="flex items-center overflow-hidden" 
            >
              <img 
                src={theme === 'light' ? logo2 : logo} 
                alt="CogniEdify" 
                className="h-10 sm:h-12 w-auto flex-shrink-0" 
              />
              {isSidebarOpen && ( // Conditionally render title
                <h1 className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 text-transparent bg-clip-text whitespace-nowrap">
                  CogniEdify
                </h1>
              )}
            </motion.div>
            {/* Mobile Close Button */}
            <button
              onClick={toggleSidebar}
              className={`lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 -mr-2 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              aria-label="Close sidebar"
            >
              <X className="h-6 w-6" />
            </button>
            {/* Desktop Collapse/Expand Button is moved outside this div, see below */}
          </div>
          
          {/* Desktop Collapse/Expand Button - Positioned absolutely */}
          <button
            onClick={toggleSidebar}
            className={`hidden lg:block absolute top-[1.8rem] z-50 p-1.5 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 
                        hover:bg-gray-100 dark:hover:bg-gray-600 shadow-lg border border-gray-200 dark:border-gray-600
                        transition-all duration-300 ease-in-out
                        ${isSidebarOpen ? 'right-3' : 'right-[-0.875rem]'}`} // right-[-0.875rem] for 1.75rem button to be half out
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            style={{ width: '1.75rem', height: '1.75rem' }} // Explicit size for button
          >
            {isSidebarOpen ? <FaChevronLeft className="h-4 w-4 mx-auto" /> : <FaChevronRight className="h-4 w-4 mx-auto" />}
          </button>
          
          {/* Main Navigation */}
          <div className="flex-1 px-2"> {/* Adjusted padding for collapsed view */}
            <div className="space-y-1">
              {mainNavItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  variants={itemVariants}
                  custom={index}
                >
                  <NavLink
                    to={item.path}
                    onClick={() => {
                      if (isSidebarOpen && window.innerWidth < 1024) { 
                        toggleSidebar();
                      }
                    }}
                    className={({ isActive }) =>
                      `group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out
                       ${isActive 
                          ? 'bg-primary-100/80 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 shadow-sm' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}
                       ${!isSidebarOpen && 'lg:justify-center lg:px-0'}` // Center content when collapsed on desktop
                    }
                    title={item.name} // Tooltip for collapsed items
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`flex items-center ${!isSidebarOpen && 'lg:w-full lg:justify-center'}`}>
                          <div className={`p-2 rounded-lg ${isActive ? 'bg-primary-100 dark:bg-primary-500/20' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-white'} ${isSidebarOpen ? 'mr-3' : 'lg:mr-0'}`}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <span className={`${isSidebarOpen ? 'opacity-100' : 'lg:opacity-0 lg:hidden'} transition-opacity duration-200 whitespace-nowrap`}>{item.name}</span>
                        </div>
                        {isSidebarOpen && ( // Only show arrow if sidebar is open
                          <ArrowRight className={`h-4 w-4 ${
                            isActive
                              ? 'opacity-100 text-primary-500 dark:text-primary-400'
                              : 'opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-300'
                          } transition-opacity duration-300`} />
                        )}
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom Section with Billing */}
          <motion.div 
            variants={itemVariants}
            className={`px-2 mt-6 border-t border-gray-200 dark:border-gray-800 pt-4 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}
          >
            <NavLink
              to="/billing"
              onClick={() => {
                if (isSidebarOpen && window.innerWidth < 1024) {
                  toggleSidebar();
                }
              }}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                } ${!isSidebarOpen && 'lg:justify-center lg:px-0'}`
              }
              title="Manage Subscription"
            >
              {({ isActive }) => (
                <>
                  <div className={`flex items-center ${!isSidebarOpen && 'lg:w-full lg:justify-center'}`}>
                    <div className={`p-2 rounded-lg bg-opacity-20 text-inherit ${isSidebarOpen ? 'mr-3' : 'lg:mr-0'}`}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <span className={`${isSidebarOpen ? 'opacity-100' : 'lg:opacity-0 lg:hidden'} transition-opacity duration-200 whitespace-nowrap`}>Manage Subscription</span>
                  </div>
                  {isSidebarOpen && (
                    <ArrowRight className={`h-4 w-4 ${
                      isActive
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    } transition-opacity duration-300`} />
                  )}
                </>
              )}
            </NavLink>
          </motion.div>

          {/* Profile section */}
          <motion.div 
            variants={itemVariants}
            className={`mt-6 px-2 pt-4 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}
          >
            <div className={`flex items-center space-x-4 px-3 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl ${!isSidebarOpen && 'lg:justify-center lg:px-0 lg:space-x-0'}`}>
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0">
                {user?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.username || user?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.role === 'admin' ? 'Admin Plan' : 'Free Plan'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
