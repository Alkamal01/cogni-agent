import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Users, Target, Zap, ArrowRight, CheckCircle, BookOpen, TrendingUp, Sparkles, Zap as ActivityIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}


// Feature Card Component
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl dark:shadow-gray-900/30 transition-all duration-300 hover:translate-y-[-5px] border border-gray-100 dark:border-gray-700"
    >
      <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-5 text-white transform rotate-3">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </motion.div>
  );
};


const FeatureSection: React.FC = () => {
  // Define features array
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Personalized AI Tutoring",
      description: "Experience intelligent, one-on-one guidance through AI-powered tutors that adapt in real time to your learning pace, preferences, and performance."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Adaptive Learning Paths",
      description: "Your journey is never static. Our system evolves with your progress — adjusting lessons, content difficulty, and support based on what you know and where you need to grow."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Real-Time Collaborative Learning",
      description: "Learn in global study groups and real-time sessions that promote active peer engagement, shared problem-solving, and diverse perspectives."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Smart Learning Insights",
      description: "We provide deep, actionable analytics on your learning habits — offering nudges, reminders, and recommendations that help you stay on track and get better results."
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Global-Ready Localization",
      description: "We don't just translate — we transform. Lessons are adapted to your region's culture, curriculum, and language, making learning more relatable and effective."
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Verified Progress Tracking",
      description: "Earn verifiable digital badges and reports that reflect your true skills and growth — perfect for showcasing your progress without relying on formal certificates alone."
    }
  ];


  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-primary-600 dark:text-primary-400 font-semibold tracking-wide uppercase"
            >
              Features
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
            >
              Designed for Optimal Learning
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300"
            >
              Our platform combines cutting-edge AI with researched learning methodologies to deliver an unparalleled educational experience.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>


      {/* AI-Powered Learning Intelligence Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-primary-600 dark:text-primary-400 font-semibold tracking-wide uppercase"
            >
              AI Learning Intelligence
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
            >
              AI-Powered Personalized Learning
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300"
            >
              Our advanced AI analyzes your cognitive strengths and learning patterns to create truly personalized educational experiences that adapt in real-time.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Cognitive Fingerprinting
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI analyzes your unique learning patterns, cognitive strengths, and preferences to create your personalized learning profile.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Adaptive Learning Paths
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Dynamic study plans that evolve with your progress, adjusting difficulty and content based on your performance and learning pace.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
                <ActivityIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Real-Time Adaptation
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Instant adjustments to lessons, content difficulty, and learning strategies based on your attention, fatigue, and comprehension levels.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Intelligent Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Deep insights into your learning behavior with predictive analytics that help optimize your study sessions and improve outcomes.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mr-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  The Future of Learning is Here
                </h3>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Experience education that thinks with you, adapts to you, and grows with you. Our AI doesn't just teach—it understands how you learn.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/auth/register" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Start Your AI Learning Journey <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  to="/features" 
                  className="inline-flex items-center px-6 py-3 border border-primary-600 text-base font-medium rounded-md text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  Learn More About Our AI
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default FeatureSection;
