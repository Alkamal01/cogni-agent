import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
// import { useTheme } from '../contexts/ThemeContext'; // May not be needed
import { Mail, MessageSquare, Home, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import LandingHeader from '../components/landing/LandingHeader'; // Import LandingHeader
import Footer from '../components/shared/Footer';

// Contact Form Component
interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Simulate API call
    try {
      // In a real application, you would make an API call here
      // await api.post('/contact', formData);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      setError('There was an error submitting your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 text-center"
      >
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Message Sent!</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Thank you for reaching out to us. We've received your message and will respond within 24-48 hours.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          Send Another Message
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700"
    >
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select a subject</option>
            <option value="General Inquiry">General Inquiry</option>
            <option value="Technical Support">Technical Support</option>
            <option value="Billing Question">Billing Question</option>
            <option value="Partnership Opportunity">Partnership Opportunity</option>
            <option value="Feature Request">Feature Request</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            value={formData.message}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md" role="alert">
            {error}
          </div>
        )}
        
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-5 w-5" />
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
};

// Office Location Card Component
interface OfficeProps {
  city: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  delay?: number;
}

const OfficeLocation: React.FC<OfficeProps> = ({ city, address, phone, email, hours, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
  >
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{city}</h3>
    <div className="space-y-3">
      <div className="flex items-start">
        <Home className="h-5 w-5 text-primary-500 dark:text-primary-400 mr-3 mt-0.5" />
        <span className="text-gray-600 dark:text-gray-300">{address}</span>
      </div>
      <div className="flex items-center">
        <MessageSquare className="h-5 w-5 text-primary-500 dark:text-primary-400 mr-3" />
        <span className="text-gray-600 dark:text-gray-300">{phone}</span>
      </div>
      <div className="flex items-center">
        <Mail className="h-5 w-5 text-primary-500 dark:text-primary-400 mr-3" />
        <span className="text-gray-600 dark:text-gray-300">{email}</span>
      </div>
      <div className="flex items-start">
        <Clock className="h-5 w-5 text-primary-500 dark:text-primary-400 mr-3 mt-0.5" />
        <span className="text-gray-600 dark:text-gray-300">{hours}</span>
      </div>
    </div>
  </motion.div>
);

// FAQ Item Component
interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left focus:outline-none"
      >
        <h4 className="text-lg font-medium text-gray-900 dark:text-white">{question}</h4>
        <svg
          className={`h-5 w-5 text-gray-500 dark:text-gray-400 transform ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-2 text-gray-600 dark:text-gray-300"
        >
          <p>{answer}</p>
        </motion.div>
      )}
    </div>
  );
};

const Contact: React.FC = () => {
  // const { theme } = useTheme(); // Removed
  // Logo images based on theme - removed
  
  // Office locations data
  const officeLocations = [
    {
      city: "Abuja",
      address: "Abuja Central Area",
      phone: "+234 81 6090 8879",
      email: "info@cogniedufy.app",
      hours: "Monday - Friday: 9:00 AM - 6:00 PM"
    }//,
    // {
    //   city: "New York",
    //   address: "456 Tech Avenue, New York, NY 10001",
    //   phone: "+1 (212) 555-5678",
    //   email: "ny@CogniEdufy.com",
    //   hours: "Monday - Friday: 9:00 AM - 6:00 PM"
    // },
    // {
    //   city: "London",
    //   address: "78 Educational Lane, London, UK EC2A 4NE",
    //   phone: "+44 20 7946 0958",
    //   email: "london@CogniEdufy.com",
    //   hours: "Monday - Friday: 9:00 AM - 5:30 PM"
    // }
  ];
  
  // FAQ data
  const faqItems = [
    {
      question: "How quickly will I receive a response to my inquiry?",
      answer: "We strive to respond to all inquiries within 24-48 business hours. For urgent matters, we recommend reaching out via phone to our customer support team for faster assistance."
    },
    {
      question: "Can I schedule a demo of CogniEdufy?",
      answer: "Absolutely! You can request a demo through the contact form by selecting 'General Inquiry' in the subject dropdown and mentioning your interest in a demo in the message field. Our team will reach out to schedule a convenient time."
    },
    {
      question: "How can I report a technical issue?",
      answer: "For technical issues, please select 'Technical Support' in the subject dropdown when filling out the contact form. Provide as much detail as possible about the issue you're experiencing, including any error messages, the device you're using, and steps to reproduce the problem."
    },
    {
      question: "Do you offer support in languages other than English?",
      answer: "Yes, we offer support in multiple languages including Spanish, French, German, Chinese, and Japanese. Please specify your preferred language in your message, and we'll make sure to connect you with a team member who can assist you in that language."
    },
    {
      question: "How can I apply for a job at CogniEdufy?",
      answer: "We're always looking for talented individuals to join our team! For job inquiries, please visit our Careers page or email your resume and cover letter to careers@CogniEdufy.com with the position you're interested in."
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"> {/* Ensure text color is set */}
      <LandingHeader />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-6"
            >
              Get in Touch with <span className="text-primary-600 dark:text-primary-400">CogniEdufy</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 mb-8"
            >
              Have questions, feedback, or need support? We're here to help. Reach out through the form below or contact us directly.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <span className="inline-block px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
                  Send Us a Message
                </span>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  We'd Love to Hear From You
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Fill out the form and our team will get back to you as soon as possible. Your feedback helps us improve our service.
                </p>
              </motion.div>
              
              <ContactForm />
            </div>
            
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <span className="inline-block px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
                  Our Offices
                </span>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Visit Us at Our Locations
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  We have offices in key locations to serve you better. Feel free to stop by during business hours.
                </p>
              </motion.div>
              
              <div className="space-y-6">
                {officeLocations.map((office, index) => (
                  <OfficeLocation
                    key={office.city}
                    city={office.city}
                    address={office.address}
                    phone={office.phone}
                    email={office.email}
                    hours={office.hours}
                    delay={index * 0.1}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
              Global Presence
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Find Us on the Map
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our headquarters and global offices are strategically located to serve our customers worldwide.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-xl overflow-hidden shadow-xl"
          >
            {/* Placeholder for map - in a real implementation you'd use Google Maps or similar */}
            <div className="bg-gray-300 dark:bg-gray-700 w-full h-96 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Interactive map would be displayed here.<br />
                  (Google Maps or similar integration)
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Common Questions About Contacting Us
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Find quick answers to frequently asked questions about our contact process and support services.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-8"
          >
            {faqItems.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </motion.div>
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
              Ready to Transform Your Learning Experience?
            </h2>
            <p className="text-xl text-primary-100 mb-10">
              Join thousands of satisfied users who have enhanced their educational journey with CogniEdufy.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/auth/register"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-600 bg-white hover:bg-gray-50"
              >
                Start Learning
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-primary-700"
              >
                Explore Features
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

export default Contact;
