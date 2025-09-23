import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
// import { useTheme } from '../contexts/ThemeContext'; // May not be needed
import { Clock, TrendingUp, Shield, CheckCircle } from 'lucide-react';
import LandingHeader from '../components/landing/LandingHeader'; // Import LandingHeader
import Footer from '../components/shared/Footer';

// Team member component
interface TeamMemberProps {
  name: string;
  role: string;
  bio: string;
  image: string;
  delay?: number;
}

const TeamMember: React.FC<TeamMemberProps> = ({ name, role, bio, image, delay = 0 }) => (
  <motion.div
    initial={{ y: 30, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="flex flex-col items-center text-center"
  >
    <div className="relative mb-5">
      <div className="w-48 h-48 rounded-full overflow-hidden mb-4 border-4 border-white dark:border-gray-800 shadow-lg">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${name}&background=random&size=200`;
          }}
        />
      </div>
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
        {role}
      </div>
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{name}</h3>
    <p className="text-gray-600 dark:text-gray-300 max-w-xs">{bio}</p>
  </motion.div>
);

// Value card component
interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay?: number;
}

const ValueCard: React.FC<ValueCardProps> = ({ 
  icon, 
  title, 
  description, 
  color,
  delay = 0 
}) => (
  <motion.div
    initial={{ y: 30, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-100 dark:border-gray-700"
  >
    <div className={`w-14 h-14 flex items-center justify-center rounded-full mb-6 ${color}`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300">{description}</p>
  </motion.div>
);

// Timeline item component
interface TimelineItemProps {
  year: string;
  title: string;
  description: string;
  isLast?: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ year, title, description, isLast = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="flex items-start"
  >
    <div className="flex flex-col items-center mr-8">
      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
        {year}
      </div>
      {!isLast && (
        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-4"></div>
      )}
    </div>
    <div className={`pb-12 ${isLast ? '' : 'border-b border-gray-200 dark:border-gray-700'}`}>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  </motion.div>
);

const About: React.FC = () => {
  // const { theme } = useTheme(); // Removed
  // Logo images based on theme - removed
  
  // Team members data
  const teamMembers = [
    {
      name: "Kamal Aliyu",
      role: "Founder & CEO",
      bio: "AI Software Engineer with 5+ years of experience in AI and educational technology. Kamal founded CogniEdufy to revolutionize how people learn.",
      image: "/images/ak.png"
    },
    {
      name: "Abdullateef Mubarak",
      role: "CTO",
      bio: "Software Engineer with expertise in building scalable applications and leading technical development. Abdullateef drives the technology vision at CogniEdufy.",
      image: "/images/mk.jpg"
    },
    {
      name: "Mubarak Aminu",
      role: "COO",
      bio: "Business Developer and Project Manager with extensive experience in operations and strategic planning. Mubarak ensures smooth project execution and business growth at CogniEdufy.",
      image: "/images/mkm.jpeg"
    },
  ];
  
  // Company values data
  const values = [
    {
      icon: <TrendingUp className="h-6 w-6 text-white" />,
      title: "Continuous Growth",
      description: "We believe that learning never stops. Our platform and team constantly evolve to provide the best educational experience.",
      color: "bg-blue-500"
    },
    {
      icon: <Shield className="h-6 w-6 text-white" />,
      title: "Trust & Privacy",
      description: "We prioritize the security of user data and create a safe environment for all learners to explore and grow.",
      color: "bg-green-500"
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-white" />,
      title: "Excellence",
      description: "We strive for excellence in all aspects of our platform, from AI algorithms to user experience and educational content.",
      color: "bg-purple-500"
    },
    {
      icon: <Clock className="h-6 w-6 text-white" />,
      title: "Adaptability",
      description: "Our platform adapts to each learner's unique needs, pace, and style, ensuring personalized education for everyone.",
      color: "bg-red-500"
    }
  ];
  
  // Timeline data
  const timelineEvents = [
    {
      year: "2024",
      title: "The Beginning",
      description: "CogniEdufy was founded with a mission to democratize education through AI. The initial prototype focused on personalized learning paths."
    },
    {
      year: "2025",
      title: "AI Tutor Launch",
      description: "We launched our core AI tutoring system, capable of adapting to individual learning styles and providing personalized guidance."
    },
    {
      year: "2025",
      title: "Collaborative Learning",
      description: "Added collaborative features to enable group learning and peer support, expanding our platform beyond individual tutoring."
    },
    {
      year: "Today",
      title: "Continuous Innovation",
      description: "Today, we continue to innovate at the intersection of AI and education, with a growing community of learners across the globe."
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"> {/* Ensure text color is set */}
      <LandingHeader />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="md:w-1/2"
            >
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
                Transforming Education Through <span className="text-primary-600 dark:text-primary-400">Intelligent AI</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                At CogniEdufy, we're on a mission to democratize education and make personalized learning accessible to everyone, everywhere.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/features"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Our Solutions
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-700 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Get in Touch
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="md:w-1/2"
            >
              <img
                src="/images/about-hero.jpg"
                alt="CogniEdufy Team"
                className="rounded-xl shadow-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80";
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
              Our Mission
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why We Created CogniEdufy
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We believe that everyone deserves access to personalized, high-quality education that adapts to their unique learning style.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Vision</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We envision a world where education is not a one-size-fits-all approach, but a personalized journey tailored to each individual's strengths, challenges, and aspirations. Through innovative AI technology, we aim to make learning more accessible, effective, and enjoyable for everyone.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                By breaking down traditional barriers to education, we're creating opportunities for people from all walks of life to achieve their full potential, regardless of location, background, or resources.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Impact</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">500k+</div>
                  <p className="text-gray-600 dark:text-gray-300">Active Learners</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">150+</div>
                  <p className="text-gray-600 dark:text-gray-300">Countries</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">92%</div>
                  <p className="text-gray-600 dark:text-gray-300">Improvement Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">24/7</div>
                  <p className="text-gray-600 dark:text-gray-300">Tutoring Access</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
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
              Our Values
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              What Drives Us
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our core values shape everything we do, from product development to customer support.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <ValueCard
                key={value.title}
                icon={value.icon}
                title={value.title}
                description={value.description}
                color={value.color}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
              Our Team
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Meet the Minds Behind CogniEdufy
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              A diverse team of experts in AI, education, and product design, united by a passion for transforming learning.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 gap-y-16">
            {teamMembers.map((member, index) => (
              <TeamMember
                key={member.name}
                name={member.name}
                role={member.role}
                bio={member.bio}
                image={member.image}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
              Our Journey
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              The CogniEdufy Story
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From a simple idea to a global educational platform, our journey continues to evolve.
            </p>
          </motion.div>

          <div className="space-y-12">
            {timelineEvents.map((event, index) => (
              <TimelineItem
                key={event.year}
                year={event.year}
                title={event.title}
                description={event.description}
                isLast={index === timelineEvents.length - 1}
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
              Join Us in Reshaping Education
            </h2>
            <p className="text-xl text-primary-100 mb-10">
              Be part of our journey to make quality education accessible to everyone, everywhere.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/auth/register"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-600 bg-white hover:bg-gray-50"
              >
                Start Learning
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-primary-700"
              >
                Contact Us
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

export default About;
