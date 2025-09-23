import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TestimonialCardProps {
  name: string;
  role: string;
  content: string;
  image: string;
  index: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ name, role, content, image, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col h-full"
    >
      <div className="flex-1">
        <div className="flex mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          ))}
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
          "{content}"
        </p>
      </div>
      <div className="flex items-center pt-4 border-t border-gray-100 dark:border-gray-700">
        <img
          src={image}
          alt={name}
          className="w-12 h-12 rounded-full ring-2 ring-primary-500 p-0.5"
        />
        <div className="ml-4">
          <h4 className="font-bold text-gray-900 dark:text-white">
            {name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {role}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const TestimonialsSection: React.FC = () => {
  // Testimonial data
  const testimonials = [
    {
      name: "Muhammad Hassan",
      role: "Computer Science Student",
      content: "CogniEdufy transformed my learning experience completely. The AI tutors identified my knowledge gaps and created personalized lessons that helped me ace my algorithms class!",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
    },
    {
      name: "Mal. Zubairu Rilwan",
      role: "High School Teacher",
      content: "As an educator, I'm impressed by how CogniEdufy complements classroom learning. My students who use it show remarkable improvement in their problem-solving skills.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
    },
    {
      name: "Abdullateef Mubarak",
      role: "Software Engineer",
      content: "The collaborative features made remote studying with peers seamless and engaging. We completed our group project in half the time with twice the quality.",
      image: "https://randomuser.me/api/portraits/men/2.jpg"
    },
    {
      name: "Nabila Aliyu",
      role: "High School Student",
      content: "I struggled with math until I found CogniEdufy. The personalized approach and step-by-step guidance helped me understand concepts I'd been struggling with for years.",
      image: "https://randomuser.me/api/portraits/women/3.jpg"
    },
    {
      name: "Prof. M.B. Mu'azu",
      role: "College Professor",
      content: "CogniEdufy has revolutionized how I approach teaching. The analytics provide valuable insights into student progress, allowing me to tailor my lectures more effectively.",
      image: "https://randomuser.me/api/portraits/men/4.jpg"
    }
  ];

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Number of visible items based on viewport size
  // For responsive behavior, we would ideally use a useMediaQuery hook
  const getVisibleItems = () => {
    // In a real implementation, this would check window width
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 3; // Desktop
      if (window.innerWidth >= 768) return 2; // Tablet
      return 1; // Mobile
    }
    return 3; // Default to desktop on SSR
  };
  
  const [visibleItems, setVisibleItems] = useState(3);
  
  // Update visible items on resize
  useEffect(() => {
    const handleResize = () => {
      setVisibleItems(getVisibleItems());
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Auto-advance carousel
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        nextSlide();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [currentIndex, isPaused, visibleItems]);
  
  // Navigation functions
  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - visibleItems ? 0 : prevIndex + 1
    );
  };
  
  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - visibleItems : prevIndex - 1
    );
  };

  // Get visible testimonials
  const getVisibleTestimonials = () => {
    return testimonials.slice(currentIndex, currentIndex + visibleItems);
  };

  return (
    <section id="testimonials" className="py-24 bg-gray-50 dark:bg-gray-900 overflow-hidden">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
   <motion.div 
     initial={{ opacity: 0, y: 20 }}
     whileInView={{ opacity: 1, y: 0 }}
     viewport={{ once: true }}
          transition={{ duration: 0.5 }}
     className="text-center mb-16"
   >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
       What Our Users Say
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Discover how CogniEdufy has helped students and professionals achieve their learning goals.
     </p>
   </motion.div>

        {/* Carousel container */}
        <div className="relative">
          {/* Main carousel */}
          <div 
            className="relative overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Navigation buttons */}
            <div className="flex justify-between absolute top-1/2 transform -translate-y-1/2 left-0 right-0 z-10 px-4">
              <button 
                onClick={prevSlide}
                className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Previous testimonial"
              >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={nextSlide}
                className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Next testimonial"
              >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence initial={false} custom={direction}>
                {getVisibleTestimonials().map((testimonial, index) => (
       <TestimonialCard 
                    key={`${currentIndex}-${index}`}
         name={testimonial.name}
         role={testimonial.role}
         content={testimonial.content}
         image={testimonial.image}
         index={index}
       />
     ))}
              </AnimatePresence>
 </div>
</div>

          {/* Indicators */}
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: testimonials.length - visibleItems + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`h-2 transition-all duration-300 rounded-full ${
                  currentIndex === index 
                    ? 'bg-primary-600 w-8' 
                    : 'bg-gray-300 dark:bg-gray-700 w-2 hover:bg-primary-400 dark:hover:bg-primary-700'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
         </div>
       </div>
     
        {/* CTA Section */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       whileInView={{ opacity: 1, y: 0 }}
       viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-20 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to transform your learning journey?
          </h3>
          <Link
            to="/auth/register"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-300"
          >
            Get Started Free
         </Link>
     </motion.div>
   </div>
    </section>
  );
};

export default TestimonialsSection;