import React from 'react'; // Removed useState
// Link, Moon, Sun, useTheme might not be needed if LandingHeader handles all nav logic
import Footer from '../components/shared/Footer';
import LandingHeader from '../components/landing/LandingHeader'; // Import the new header
import HeroSection from '../components/landing/hero';
import FeatureSection from '../components/landing/feature';
import BrandSection from '../components/landing/brand';
import FAQSection from '../components/landing/faq';
import TestimonialsSection from '../components/landing/testimonial';

// logoImages, theme, toggleTheme, isMenuOpen, setIsMenuOpen, logo are removed as they are handled by LandingHeader

const LandingPage: React.FC = () => {
  // Theming for the page wrapper is still useful if LandingHeader doesn't wrap the whole page
  // For now, assuming the root div handles its own theme classes.
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <LandingHeader />
      
      {/* Main content */}
      <main>
        <HeroSection />
        <FeatureSection />
        <BrandSection />
        <TestimonialsSection />
        <FAQSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
