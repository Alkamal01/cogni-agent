import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
// import { useTheme } from '../contexts/ThemeContext'; // May not be needed
import LandingHeader from '../components/landing/LandingHeader'; // Import LandingHeader
import Footer from '../components/shared/Footer';

// Testimonial card component
interface TestimonialCardProps {
  name: string;
  role: string;
  content: string;
  image: string;
  rating: number;
  category: string;
  delay?: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  name, 
  role, 
  content, 
  image, 
  rating,
  category,
  delay = 0 
}) => (
  <motion.div
    initial={{ y: 30, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col h-full"
  >
    <div className="flex-1">
      <div className="flex mb-2">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-5 h-5 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} 
          />
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
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = `https://ui-avatars.com/api/?name=${name}&background=random`;
        }}
      />
      <div className="ml-4">
        <h4 className="font-bold text-gray-900 dark:text-white">
          {name}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {role}
        </p>
      </div>
      <div className="ml-auto">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
          {category}
        </span>
      </div>
    </div>
  </motion.div>
);

// Success story component
interface SuccessStoryProps {
  name: string;
  role: string;
  image: string;
  story: string;
  result: string;
  reverse?: boolean;
}

const SuccessStory: React.FC<SuccessStoryProps> = ({ 
  name, 
  role, 
  image, 
  story, 
  result,
  reverse = false 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 py-16 border-b border-gray-200 dark:border-gray-700 last:border-0`}
  >
    <div className="md:w-1/3">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative"
      >
        <img
          src={image}
          alt={name}
          className="rounded-2xl w-full aspect-[4/5] object-cover shadow-xl"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80`;
          }}
        />
        <div className="absolute bottom-4 left-4 right-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl">
          <h3 className="font-bold text-gray-900 dark:text-white">{name}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">{role}</p>
        </div>
      </motion.div>
    </div>
    
    <div className="md:w-2/3">
      <motion.div
        initial={{ opacity: 0, x: reverse ? 50 : -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <div className="relative pl-10">
          <div className="absolute left-0 top-0 h-full w-1 bg-primary-200 dark:bg-primary-900/50 rounded-full"></div>
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">The Challenge</h4>
          <p className="text-gray-600 dark:text-gray-300">{story}</p>
        </div>
        
        <div className="relative pl-10">
          <div className="absolute left-0 top-0 h-full w-1 bg-green-200 dark:bg-green-900/50 rounded-full"></div>
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">The Result</h4>
          <p className="text-gray-600 dark:text-gray-300">{result}</p>
        </div>
        
        <div className="flex justify-end">
          <Link
            to="/auth/register"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 font-medium"
          >
            Start your journey <ChevronDown className="ml-2 h-5 w-5 rotate-270" style={{ transform: 'rotate(-90deg)' }} />
          </Link>
        </div>
      </motion.div>
    </div>
  </motion.div>
);

// Category filter component
interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, activeCategory, onChange }) => (
  <div className="flex flex-wrap justify-center gap-2 mb-12">
    {categories.map((category) => (
      <button
        key={category}
        onClick={() => onChange(category)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          activeCategory === category
            ? 'bg-primary-600 text-white shadow-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        {category}
      </button>
    ))}
  </div>
);

const Testimonials: React.FC = () => {
  // const { theme } = useTheme(); // Removed
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Logo images based on theme - removed
  
  // Categories for filtering
  const categories = ['All', 'Students', 'Professionals', 'Educators', 'Parents'];
  
  // Testimonials data
  const testimonials = [
    {
      name: "Alex Chen",
      role: "Computer Science Student",
      content: "CogniEdufy transformed my learning experience completely. The AI tutors identified my knowledge gaps and created personalized lessons that helped me ace my algorithms class!",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
      rating: 5,
      category: "Students"
    },
    {
      name: "Sarah Johnson",
      role: "High School Teacher",
      content: "As an educator, I'm impressed by how CogniEdufy complements classroom learning. My students who use it show remarkable improvement in their problem-solving skills.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
      rating: 5,
      category: "Educators"
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      content: "The collaborative features made remote studying with peers seamless and engaging. We completed our group project in half the time with twice the quality.",
      image: "https://randomuser.me/api/portraits/men/2.jpg",
      rating: 4,
      category: "Professionals"
    },
    {
      name: "Emily Davis",
      role: "High School Student",
      content: "I struggled with math until I found CogniEdufy. The personalized approach and step-by-step guidance helped me understand concepts I'd been struggling with for years.",
      image: "https://randomuser.me/api/portraits/women/3.jpg",
      rating: 5,
      category: "Students"
    },
    {
      name: "David Wilson",
      role: "College Professor",
      content: "CogniEdufy has revolutionized how I approach teaching. The analytics provide valuable insights into student progress, allowing me to tailor my lectures more effectively.",
      image: "https://randomuser.me/api/portraits/men/4.jpg",
      rating: 5,
      category: "Educators"
    },
    {
      name: "Jennifer Lopez",
      role: "Parent",
      content: "My daughter's grades improved significantly after using CogniEdufy. The progress reports helped us understand where she needed help, and the AI tutors provided the support she needed.",
      image: "https://randomuser.me/api/portraits/women/5.jpg",
      rating: 5,
      category: "Parents"
    },
    {
      name: "Robert Smith",
      role: "Data Scientist",
      content: "The machine learning concepts were explained so well by CogniEdufy's AI tutors. I was able to apply the knowledge directly to my work projects.",
      image: "https://randomuser.me/api/portraits/men/6.jpg",
      rating: 4,
      category: "Professionals"
    },
    {
      name: "Lisa Wang",
      role: "Medical Student",
      content: "Studying for medical exams became much more efficient with CogniEdufy. The spaced repetition approach helped me retain complex information better than any other method I've tried.",
      image: "https://randomuser.me/api/portraits/women/7.jpg",
      rating: 5,
      category: "Students"
    },
    {
      name: "James Taylor",
      role: "Elementary School Teacher",
      content: "My young students love the interactive lessons and gamified approach. It's amazing to see how engaged they are when using CogniEdufy's learning modules.",
      image: "https://randomuser.me/api/portraits/men/8.jpg",
      rating: 5,
      category: "Educators"
    }
  ];
  
  // Success stories data
  const successStories = [
    {
      name: "Maya Rodriguez",
      role: "From Failing Student to Top Performer",
      image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
      story: "I was failing three subjects and on the verge of dropping out of college. Traditional tutoring didn't work for me because I couldn't afford enough sessions to keep up with the material. I felt constantly behind and overwhelmed.",
      result: "After using CogniEdufy for just two months, I went from failing grades to scoring in the top 15% of my class. The AI tutors were available whenever I needed help, and the personalized learning path helped me address my specific knowledge gaps. I graduated with honors and now recommend CogniEdufy to everyone struggling with their studies."
    },
    {
      name: "Ethan Park",
      role: "Prepared for a Career Change in 6 Months",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
      story: "After 10 years in retail management, I wanted to transition to software development but had no formal education in programming. Traditional coding bootcamps were too expensive and required me to quit my job.",
      result: "With CogniEdufy's flexible learning paths, I could study at my own pace while keeping my day job. The platform adapted to my learning style and recommended resources that matched my goals. After 6 months of consistent study, I landed my first junior developer role. The personalized AI feedback on my coding projects was invaluable."
    },
    {
      name: "Dr. Olivia Washington",
      role: "Transformed University Teaching Methods",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
      story: "As a university professor, I was frustrated by the one-size-fits-all approach to education. Some students were bored while others struggled to keep up. I needed a way to provide more personalized attention without extending my already packed schedule.",
      result: "Implementing CogniEdufy as a supplementary tool in my courses led to a 32% improvement in overall class performance. Students appreciated the additional support, and I could focus my lecture time on more complex discussions rather than basic concept explanations. The analytics dashboard helped me identify common misconceptions and adjust my teaching accordingly."
    }
  ];
  
  // Filter testimonials based on active category
  const filteredTestimonials = activeCategory === 'All'
    ? testimonials
    : testimonials.filter(t => t.category === activeCategory);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"> {/* Ensure text color is set */}
      <LandingHeader />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
              Our Users Love <span className="text-primary-600 dark:text-primary-400">CogniEdufy</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
              Discover how CogniEdufy has helped students, professionals, and educators transform their learning experience.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="max-w-5xl mx-auto mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2 border border-gray-100 dark:border-gray-700">
              <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                  title="CogniEdufy Testimonials"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <button className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg text-primary-600 dark:text-primary-400">
                <ChevronDown className="h-6 w-6" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24" id="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Don't just take our word for it—hear from our diverse community of learners.
            </p>
          </motion.div>

          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTestimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.name}
                name={testimonial.name}
                role={testimonial.role}
                content={testimonial.content}
                image={testimonial.image}
                rating={testimonial.rating}
                category={testimonial.category}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-24 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
              Success Stories
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Real Transformations
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover how CogniEdufy has made a significant impact on our users' lives.
            </p>
          </motion.div>

          <div className="space-y-8">
            {successStories.map((story, index) => (
              <SuccessStory
                key={story.name}
                name={story.name}
                role={story.role}
                image={story.image}
                story={story.story}
                result={story.result}
                reverse={index % 2 === 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-600 dark:bg-primary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Join Thousands of Satisfied Learners
            </h2>
            <p className="text-xl text-primary-100 mb-10">
              Start your learning journey today and experience the CogniEdufy difference.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/auth/register"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-600 bg-white hover:bg-gray-50"
              >
                Start Free Trial
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-primary-700"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Testimonials;
