import { useEffect, useState } from 'react';
import { 
  Heart, Users, Shield, ArrowRight, CheckCircle, Globe, 
  MessageSquare, ChevronRight, Hexagon,
  UserPlus, Search, TrendingUp, Facebook, Twitter, Instagram, Linkedin
} from 'lucide-react';
import { LoginModal } from './auth/LoginModal';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'community_member' | 'organization'>('community_member');
  const [initialSignUp, setInitialSignUp] = useState(false);
  const { user, isSubmitting } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'how' | 'features' | 'organizations' | 'support'>('how');

  useEffect(() => {
    if (isSubmitting) return;
    if (!user) return;
    const target = user.role === 'admin'
      ? '/admin'
      : user.role === 'organization'
        ? '/cbo'
        : '/client';
    navigate(target, { replace: true });
  }, [user, isSubmitting, navigate]);

  const handleSignIn = (role: 'community_member' | 'organization') => {
    setSelectedRole(role);
    setInitialSignUp(false);
    setShowLoginModal(true);
  };

  const handleSignUp = (role: 'community_member' | 'organization') => {
    setSelectedRole(role);
    setInitialSignUp(true);
    setShowLoginModal(true);
  };

  const navItems = [
    { id: 'how' as const, label: 'How it works', href: '#how-it-works' },
    { id: 'features' as const, label: 'Features', href: '#features' },
    { id: 'organizations' as const, label: 'For organizations', href: '#for-organizations' },
    { id: 'support' as const, label: 'Support', href: '#support' },
  ];

  useEffect(() => {
    const ids = navItems.map((n) => n.href.replace('#', ''));
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (!visible?.target) return;
        const id = (visible.target as HTMLElement).id;
        const match = navItems.find((n) => n.href === `#${id}`);
        if (match) setActiveSection(match.id);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0.1, 0.2, 0.3] },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const features = [
    {
      icon: <Heart />,
      title: "Find Essential Services",
      description: "Discover housing, food, healthcare, and education services in your community"
    },
    {
      icon: <Users />,
      title: "Community Connect",
      description: "Stay informed about local events, resources, and support networks"
    },
    {
      icon: <Shield />,
      title: "Secure & Private",
      description: "Your personal information is protected with enterprise-grade security"
    },
    {
      icon: <Globe />,
      title: "Multilingual Support",
      description: "Access services in multiple languages for better accessibility"
    },
    {
      icon: <MessageSquare />,
      title: "Direct Communication",
      description: "Chat directly with service providers and case managers"
    },
    {
      icon: <CheckCircle />,
      title: "Track Applications",
      description: "Monitor your service applications and appointments in real-time"
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-600 pt-14 md:pt-[68px]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-14 md:h-[68px] flex items-center shadow-sm">
        <div className="w-full max-w-[1200px] mx-auto px-4 md:px-12 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo.png" alt="HealthPowr Logo" className="h-10 md:h-[48px] w-auto flex-shrink-0" />
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-[13px] font-semibold text-gray-500">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={`transition-colors ${
                  activeSection === item.id ? 'text-teal-700' : 'hover:text-teal-600'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/staff-login"
              className="text-gray-600 font-medium text-sm hover:text-teal-600 transition-colors min-h-[44px] px-2 inline-flex items-center"
            >
              Staff Login
            </Link>
            <button 
              onClick={() => handleSignIn('community_member')}
              className="text-gray-600 font-medium text-sm hover:text-teal-600 transition-colors min-h-[44px] px-2"
            >
              Sign In
            </button>
            <button 
              onClick={() => handleSignUp('community_member')}
              className="bg-teal-600 text-white px-4 md:px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-teal-700 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.08)] min-h-[44px] whitespace-nowrap"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white py-10 md:py-20 overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 opacity-[0.04] text-teal-600 pointer-events-none hidden md:block">
          <Hexagon className="w-[800px] h-[800px]" strokeWidth={0.5} />
        </div>

        <div className="max-w-[1200px] mx-auto px-5 md:px-12 relative z-10 text-center">
          <div className="inline-flex items-center px-3 md:px-4 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-600 text-[12px] md:text-[13px] font-medium mb-5 md:mb-6">
            <span className="mr-1.5">✦</span> Trusted by 10,000+ community members
          </div>
          
          <h1 className="text-gray-900 font-extrabold leading-[1.15] tracking-tight mb-4 md:mb-5 text-[clamp(1.75rem,6vw,3.75rem)]">
            Your Gateway to <br className="hidden sm:block" />
            <span className="text-teal-600">Essential Services</span>
          </h1>
          
          <p className="max-w-[520px] mx-auto text-[15px] md:text-lg text-gray-600 leading-relaxed mb-6 md:mb-8">
            HealthPowr connects you with local social services—from housing and food support 
            to healthcare and education.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 md:gap-3 mb-8 md:mb-10 max-w-md sm:max-w-none mx-auto">
            <button 
              onClick={() => handleSignIn('community_member')}
              className="w-full sm:w-auto bg-teal-600 text-white px-7 py-3 md:py-3.5 rounded-[10px] font-semibold text-base hover:bg-teal-700 transition-all shadow-[0_4px_14px_rgba(13,148,136,0.3)] flex items-center justify-center group min-h-[52px]"
            >
              Find Services
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => handleSignUp('organization')}
              className="w-full sm:w-auto bg-white text-teal-600 border-2 border-teal-600 px-7 py-2.5 md:py-3 rounded-[10px] font-semibold text-base hover:bg-teal-50 transition-colors flex items-center justify-center min-h-[52px]"
            >
              For Organizations
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] md:text-[13px] text-gray-500 font-medium">
            <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1.5 text-teal-600" /> Free to use</span>
            <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1.5 text-teal-600" /> Multilingual</span>
            <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1.5 text-teal-600" /> Privacy protected</span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-50 border-y border-gray-200 py-6 md:py-8">
        <div className="max-w-[1200px] mx-auto px-4 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            {[{v:'10,000+',l:'Community Members'},{v:'500+',l:'Organizations'},{v:'5',l:'Boroughs'},{v:'98%',l:'Satisfaction Rate'}].map((s,i)=>(
              <div key={i} className="px-2 md:px-4 py-3 md:py-0 bg-white md:bg-transparent rounded-xl md:rounded-none border border-gray-100 md:border-0">
                <div className="text-[20px] md:text-[24px] font-bold tracking-tight text-teal-600 mb-0.5 md:mb-1">{s.v}</div>
                <div className="text-[12px] md:text-sm font-medium text-gray-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="bg-gray-50 py-12 md:py-20 lg:py-24 scroll-mt-24">
        <div className="max-w-[1200px] mx-auto px-5 md:px-12 text-center">
          <h2 className="text-[20px] md:text-[24px] font-bold tracking-tight text-gray-900 mb-10 md:mb-16">How HealthPowr Works</h2>
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-[20px] left-[15%] right-[15%] h-px border-t-2 border-dashed border-teal-100 z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center flex-1">
              <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex-shrink-0   bg-teal-600 text-white font-bold flex items-center justify-center text-lg mb-6 shadow-md shadow-teal-600/20 ring-4 ring-gray-50">1</div>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-teal-600 shadow-sm border border-gray-100 mb-4">
                <UserPlus className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Create Your Profile</h3>
              <p className="text-sm text-gray-500 max-w-[240px]">Sign up securely and tell us a bit about your current needs.</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center flex-1">
              <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex-shrink-0   bg-teal-600 text-white font-bold flex items-center justify-center text-lg mb-6 shadow-md shadow-teal-600/20 ring-4 ring-gray-50">2</div>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-teal-600 shadow-sm border border-gray-100 mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Find Services Near You</h3>
              <p className="text-sm text-gray-500 max-w-[240px]">Browse our directory and instantly apply to matched programs.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center flex-1">
              <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex-shrink-0   bg-teal-600 text-white font-bold flex items-center justify-center text-lg mb-6 shadow-md shadow-teal-600/20 ring-4 ring-gray-50">3</div>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-teal-600 shadow-sm border border-gray-100 mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Track Your Progress</h3>
              <p className="text-sm text-gray-500 max-w-[240px]">Communicate with providers and view status updates in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-12 md:py-20 lg:py-24 scroll-mt-24">
        <div className="max-w-[1200px] mx-auto px-5 md:px-12">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-[20px] md:text-[24px] font-bold tracking-tight text-gray-900 mb-3 md:mb-4">
              Everything You Need to Access Care
            </h2>
            <p className="text-[14px] md:text-base text-gray-500 max-w-[540px] mx-auto">
              Comprehensive tools to help you find and track essential services.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white rounded-[16px] border border-gray-200 p-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(13,148,136,0.10)] hover:border-teal-600 hover:-translate-y-0.5 transition-all duration-200 ease-in-out cursor-pointer relative"
              >
                <div className="w-[44px] h-[44px] rounded-[10px] bg-teal-50 flex items-center justify-center text-teal-600 mb-4">
                  <div className="[&>svg]:w-[22px] [&>svg]:h-[22px]">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-[16px] font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-[14px] text-gray-500 leading-[1.6]">
                  {feature.description}
                </p>
                <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-teal-600 opacity-0 transform -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="for-organizations" className="relative bg-teal-50 border-y border-teal-100 py-12 md:py-20 lg:py-24 overflow-hidden scroll-mt-24">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-[0.06] text-teal-600 pointer-events-none hidden md:block">
          <Hexagon className="w-[600px] h-[600px]" strokeWidth={0.5} />
        </div>

        <div className="max-w-[1200px] mx-auto px-5 md:px-12 text-center relative z-10">
          <h2 className="text-teal-900 text-[1.5rem] md:text-[2.25rem] font-bold mb-3 md:mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-teal-700 text-[14px] md:text-base mb-6 md:mb-10 max-w-2xl mx-auto">
            Join thousands already using HealthPowr to connect with essential services.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 max-w-md sm:max-w-none mx-auto">
            <button 
              onClick={() => handleSignUp('community_member')}
              className="w-full sm:w-auto bg-teal-600 text-white px-8 py-3.5 rounded-[10px] font-semibold hover:bg-teal-700 transition-colors shadow-sm min-h-[52px]"
            >
              Get Started Today
            </button>
            <button 
              onClick={() => handleSignUp('organization')}
              className="w-full sm:w-auto bg-white text-teal-600 border-2 border-teal-600 px-8 py-3 rounded-[10px] font-semibold hover:bg-teal-50 transition-colors min-h-[52px]"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="support" className="bg-white border-t border-gray-200 pt-10 md:pt-16 pb-8 scroll-mt-24">
        <div className="max-w-[1200px] mx-auto px-5 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
            <div className="col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <img src="/logo.png" alt="HealthPowr Logo" className="h-14 w-auto flex-shrink-0" />
              </div>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Empowering communities through accessible social services and coordinated care.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-teal-600 transition"><Facebook className="w-5 h-5"/></a>
                <a href="#" className="text-gray-400 hover:text-teal-600 transition"><Twitter className="w-5 h-5"/></a>
                <a href="#" className="text-gray-400 hover:text-teal-600 transition"><Instagram className="w-5 h-5"/></a>
                <a href="#" className="text-gray-400 hover:text-teal-600 transition"><Linkedin className="w-5 h-5"/></a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Services</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-500 text-sm hover:text-teal-600 transition">Find Resources</a></li>
                <li><a href="#" className="text-gray-500 text-sm hover:text-teal-600 transition">Service Map</a></li>
                <li><a href="#" className="text-gray-500 text-sm hover:text-teal-600 transition">Emergency Help</a></li>
                <li><a href="#" className="text-gray-500 text-sm hover:text-teal-600 transition">Community Events</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Organizations</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-500 text-sm hover:text-teal-600 transition">Provider Portal</a></li>
                <li><a href="#" className="text-gray-500 text-sm hover:text-teal-600 transition">Join Network</a></li>
                <li><a href="#" className="text-gray-500 text-sm hover:text-teal-600 transition">Partner Resources</a></li>
                <li><a href="#" className="text-gray-500 text-sm hover:text-teal-600 transition">API Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-500 text-sm hover:text-teal-600 transition">About Us</a></li>
                <li><a href="#" className="text-gray-500 text-sm hover:text-teal-600 transition">Contact</a></li>
                <li><a href="#" className="text-gray-500 text-sm hover:text-teal-600 transition">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-500 text-sm hover:text-teal-600 transition">Terms of Service</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-[13px]">
              &copy; 2025 HealthPowr. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          role={selectedRole}
          initialSignUp={initialSignUp}
        />
      )}
    </div>
  );
}