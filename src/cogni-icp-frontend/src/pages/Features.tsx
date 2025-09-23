import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Users, 
  Target, 
  Zap, 
  ArrowRight, 
  ChevronDown, 
  Mouse,
  Sparkles,
  GraduationCap,
  BookOpen,
  BarChart2,
  CheckCircle,
  TrendingUp,
  // Moon, Sun might not be needed if LandingHeader handles theme toggle display
} from 'lucide-react';
import { Link } from 'react-router-dom';
// import { useTheme } from '../contexts/ThemeContext'; // May not be needed if only used for nav
import LandingHeader from '../components/landing/LandingHeader'; // Import LandingHeader
import Footer from '../components/shared/Footer';

// Hero animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

// Feature card component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay = 0 }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.5, delay }}
    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300"
  >
    <div className="rounded-full w-14 h-14 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300">{description}</p>
  </motion.div>
);

// Technical feature component
interface TechFeatureProps {
  title: string;
  description: string;
  image: string;
  reverse?: boolean;
}

const TechFeature: React.FC<TechFeatureProps> = ({ title, description, image, reverse = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6 }}
    className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 py-12`}
  >
    <div className="lg:w-1/2">
      <motion.img
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        src={image}
        alt={title}
        className="rounded-lg shadow-xl w-full max-w-md mx-auto"
      />
    </div>
    
    <div className="lg:w-1/2">
      <motion.h3
        initial={{ opacity: 0, x: reverse ? 50 : -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, x: reverse ? 50 : -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-xl text-gray-600 dark:text-gray-300 mb-6"
      >
        {description}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, x: reverse ? 50 : -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Link
          to="/auth/register"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 font-medium"
        >
          Learn more <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </motion.div>
    </div>
  </motion.div>
);

const Features: React.FC = () => {
  // const { theme } = useTheme(); // Removed as LandingHeader handles theme for nav
  // logoImages removed as LandingHeader handles logo
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"> {/* Ensure text color is set for content */}
      <LandingHeader />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.span 
              variants={itemVariants}
              className="inline-block px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6"
            >
              Discover Our Features
            </motion.span>
            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-8"
            >
              Revolutionizing <span className="text-primary-600 dark:text-primary-400">Education</span> with AI
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10"
            >
              CogniEdufy combines artificial intelligence, personalized learning paths, and collaborative tools to transform how you learn.
            </motion.p>
            <motion.div 
              variants={itemVariants}
              className="flex justify-center space-x-4"
            >
              <Link
                to="/auth/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                Get Started Free
              </Link>
              <a
                href="#features-overview"
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-700 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Learn More
                <ChevronDown className="ml-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-16 relative"
          >
            <img 
              src="/images/features-hero.jpg" 
              alt="CogniEdufy Platform" 
              className="rounded-xl shadow-2xl w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1587691592099-24045742c181?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
              }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-xl flex items-end justify-center pb-8">
              <a
                href="#features-overview"
                className="inline-flex items-center justify-center rounded-full bg-white/30 backdrop-blur-sm p-3 text-white hover:bg-white/40 transition-colors"
              >
                <Mouse className="h-6 w-6" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Overview Section */}
      <section id="features-overview" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features Designed for Learning
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to enhance your educational journey, from AI tutoring to collaborative tools.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="Personalized AI Tutoring"
              description="Experience intelligent, one-on-one guidance through AI-powered tutors that adapt in real time to your learning pace, preferences, and performance."
              delay={0.1}
            />
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="Adaptive Learning Paths"
              description="Your journey is never static. Our system evolves with your progress — adjusting lessons, content difficulty, and support based on what you know and where you need to grow."
              delay={0.2}
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Real-Time Collaborative Learning"
              description="Learn in global study groups and real-time sessions that promote active peer engagement, shared problem-solving, and diverse perspectives."
              delay={0.3}
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Smart Learning Insights"
              description="We provide deep, actionable analytics on your learning habits — offering nudges, reminders, and recommendations that help you stay on track and get better results."
              delay={0.4}
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Global-Ready Localization"
              description="We don't just translate — we transform. Lessons are adapted to your region's culture, curriculum, and language, making learning more relatable and effective."
              delay={0.5}
            />
            <FeatureCard
              icon={<CheckCircle className="h-6 w-6" />}
              title="Verified Progress Tracking"
              description="Earn verifiable digital badges and reports that reflect your true skills and growth — perfect for showcasing your progress without relying on formal certificates alone."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* AI Tutoring Section with Interactive Demo */}
      <section className="py-24 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
                Interactive Learning
              </span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                AI Tutoring That Feels Like Having a Human Teacher
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Experience our revolutionary AI tutor that adapts to your learning style and provides personalized step-by-step guidance. Ask questions, get immediate feedback, and master complex concepts at your own pace.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-primary-500 dark:text-primary-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Step-by-step problem solving</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-primary-500 dark:text-primary-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Multiple explanation styles</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-primary-500 dark:text-primary-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Real-time feedback and hints</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-primary-500 dark:text-primary-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Available 24/7 for any subject</span>
                </li>
              </ul>
              <Link
                to="/auth/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                Try it yourself
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="w-full max-w-lg mx-auto border border-gray-300 rounded-lg overflow-hidden shadow-md bg-white dark:bg-gray-800">
                <div className="bg-blue-600 text-white p-3 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  <span className="font-medium">AI Math Tutor</span>
                  <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Interactive</span>
                </div>
                <div className="p-4 text-gray-800 dark:text-gray-200">
                  <p className="mb-3 font-medium">Sample tutoring conversation:</p>
                  <div className="mb-3 p-3 bg-blue-500 text-white rounded-lg rounded-tr-none ml-auto max-w-[80%]">
                    I need help understanding the quadratic formula.
                  </div>
                  <div className="mb-3 p-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg rounded-tl-none max-w-[80%]">
                    I'd be happy to help you understand the quadratic formula! The quadratic formula is used to solve quadratic equations in the form ax² + bx + c = 0.
                  </div>
                  <div className="mb-3 p-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg rounded-tl-none max-w-[80%]">
                    The formula is: x = (-b ± √(b² - 4ac)) / 2a
                  </div>
                  <div className="mb-3 p-3 bg-blue-500 text-white rounded-lg rounded-tr-none ml-auto max-w-[80%]">
                    Can you help me solve this equation: 2x² - 5x + 2 = 0
                  </div>
                  <div className="mb-3 p-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg rounded-tl-none max-w-[80%]">
                    Let's solve it step by step using the quadratic formula where a=2, b=-5, c=2.
                    <br /><br />
                    After substituting into the formula and calculating, we get:
                    <br /><br />
                    x₁ = 2 and x₂ = 0.5
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technical Features Section */}
      <section className="py-24 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Technology
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Powered by cutting-edge AI and educational research to deliver the best learning experience.
            </p>
          </motion.div>

          <TechFeature
            title="Personalized AI Tutoring"
            description="Experience intelligent, one-on-one guidance through AI-powered tutors that adapt in real time to your learning pace, preferences, and performance."
            image="/images/ai-tutor.png"
          />
          
          <TechFeature
            title="Adaptive Learning Paths"
            description="Your journey is never static. Our system evolves with your progress — adjusting lessons, content difficulty, and support based on what you know and where you need to grow."
            image="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            reverse={true}
          />
          
          <TechFeature
            title="Real-Time Collaborative Learning"
            description="Learn in global study groups and real-time sessions that promote active peer engagement, shared problem-solving, and diverse perspectives."
            image="https://images.unsplash.com/photo-1587691592099-24045742c181?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
          />
          
          <TechFeature
            title="Smart Learning Insights"
            description="We provide deep, actionable analytics on your learning habits — offering nudges, reminders, and recommendations that help you stay on track and get better results."
            image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            reverse={true}
          />
          
          <TechFeature
            title="Global-Ready Localization"
            description="We don't just translate — we transform. Lessons are adapted to your region's culture, curriculum, and language, making learning more relatable and effective."
            image="https://images.unsplash.com/photo-1526470498-9ae7eb9f8b79?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
          />

          <TechFeature
            title="Verified Progress Tracking"
            description="Earn verifiable digital badges and reports that reflect your true skills and growth — perfect for showcasing your progress without relying on formal certificates alone."
            image="https://images.unsplash.com/photo-1599282236814-257afa571597?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1350&q=80"
            reverse={true}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-600 dark:bg-primary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-white mb-6"
          >
            Ready to Transform Your Learning Experience?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-primary-100 max-w-3xl mx-auto mb-10"
          >
            Join thousands of learners already benefiting from CogniEdufy's innovative platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4"
          >
            <Link
              to="/auth/register"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-600 bg-white hover:bg-gray-50"
            >
              Get Started Free
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-primary-700"
            >
              Contact Sales
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Features;
