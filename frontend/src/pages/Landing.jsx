import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  GraduationCap, 
  Target, 
  CheckCircle2, 
  ArrowRight,
  Globe,
  BookOpen,
  Users,
  Zap
} from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Guidance',
      description: 'Get personalized university recommendations based on your unique profile.',
    },
    {
      icon: Target,
      title: 'Smart Shortlisting',
      description: 'Discover Dream, Target, and Safe universities tailored for you.',
    },
    {
      icon: CheckCircle2,
      title: 'Action-Oriented',
      description: 'AI that takes actions - not just advice. Track your progress automatically.',
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Universities from USA, UK, Canada, Australia, Germany, and more.',
    },
  ];

  const stages = [
    { num: '01', title: 'Build Your Profile', desc: 'Tell us about your academics, goals, and dreams' },
    { num: '02', title: 'Discover Universities', desc: 'AI recommends the perfect matches for you' },
    { num: '03', title: 'Lock Your Choices', desc: 'Finalize your target universities' },
    { num: '04', title: 'Prepare Applications', desc: 'Get guided tasks and deadlines' },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">StudyPath<span className="text-primary-400">.ai</span></span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/login" className="btn-ghost">
            Login
          </Link>
          <Link to="/signup" className="btn-primary flex items-center gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-32 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-8"
          >
            <Zap className="w-4 h-4" />
            AI-Powered Study Abroad Planning
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Your Journey to{' '}
            <span className="gradient-text">Global Education</span>
            <br />
            Starts Here
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-dark-400 mb-10 max-w-2xl mx-auto">
            Plan your study-abroad journey with an AI counselor that understands your goals, 
            recommends universities, and guides you every step of the way.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/signup" 
              className="btn-primary text-lg px-8 py-4 flex items-center gap-2"
            >
              Start Your Journey <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/login" 
              className="btn-secondary text-lg px-8 py-4 flex items-center gap-2"
            >
              <Users className="w-5 h-5" /> I Have an Account
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 mt-16">
            {[
              { value: '50+', label: 'Countries' },
              { value: '1000+', label: 'Universities' },
              { value: '24/7', label: 'AI Support' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-dark-500 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 via-accent-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
            
            {/* Dashboard Preview */}
            <div className="relative glass-card p-6 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {/* Profile Summary */}
                <div className="col-span-1 bg-dark-800/50 rounded-xl p-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full mb-3" />
                  <div className="h-3 bg-dark-700 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-dark-700 rounded w-1/2" />
                  <div className="mt-4 space-y-2">
                    <div className="h-2 bg-primary-500/30 rounded" />
                    <div className="h-2 bg-accent-500/30 rounded w-4/5" />
                    <div className="h-2 bg-purple-500/30 rounded w-3/5" />
                  </div>
                </div>

                {/* Main Content */}
                <div className="col-span-2 space-y-4">
                  <div className="bg-dark-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-primary-400" />
                      <div className="h-3 bg-dark-700 rounded w-40" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-dark-900/50 rounded-lg p-3">
                          <div className="w-8 h-8 bg-dark-700 rounded mb-2" />
                          <div className="h-2 bg-dark-700 rounded mb-1" />
                          <div className="h-2 bg-dark-700 rounded w-2/3" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-dark-800/50 rounded-xl p-4">
                    <div className="flex gap-3">
                      <div className="flex-1 bg-dark-900/50 rounded-lg p-2 h-20" />
                      <div className="flex-1 bg-dark-900/50 rounded-lg p-2 h-20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-24 bg-dark-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Succeed</span>
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Our AI counselor combines cutting-edge technology with deep expertise in international education.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 hover:border-primary-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-dark-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Your Path to <span className="gradient-text">Success</span>
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Follow our guided 4-stage process designed to take you from exploration to admission.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {stages.map((stage, i) => (
              <motion.div
                key={stage.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                {/* Connector line */}
                {i < stages.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent" />
                )}
                
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25">
                    <span className="text-xl font-bold text-white">{stage.num}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{stage.title}</h3>
                  <p className="text-dark-400 text-sm">{stage.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/30 via-accent-500/30 to-purple-500/30 rounded-3xl blur-2xl" />
            <div className="relative glass-card p-12 text-center">
              <BookOpen className="w-16 h-16 text-primary-400 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-dark-400 mb-8 max-w-xl mx-auto">
                Join thousands of students who are already planning their dream education with StudyPath AI.
              </p>
              <Link 
                to="/signup" 
                className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-dark-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold">StudyPath.ai</span>
          </div>
          <p className="text-dark-500 text-sm">
            © 2024 StudyPath AI. Built for Humanity Founders Hackathon.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
