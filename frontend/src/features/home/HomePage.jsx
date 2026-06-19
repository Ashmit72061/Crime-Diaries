import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, FileText, Database, ShieldAlert, Cpu, ArrowRight, ClipboardCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { ROUTES } from '../../utils/constants.js';
import delhiPoliceLogo from '../../assets/delhi_police_logo.png';
import useAuthStore from '../../store/authStore.js';
import commissionerPhoto from '../../assets/commissioner.png';

const features = [
  {
    icon: FileText,
    title: 'Single-Point Data Entry',
    desc: 'Register cases, arrests, PCR dispatches, unidentified bodies, and missing persons under locked, pre-filled local PS configurations.'
  },
  {
    icon: ClipboardCheck,
    title: 'District Morning Diary',
    desc: 'Compile comprehensive summaries of the previous day\'s events, crime tallies, and local dispatches automatically at the DCP tier.'
  },
  {
    icon: Database,
    title: 'Interactive Command Filters',
    desc: 'Query global NCT data logs at the Headquarters tier by crime categories, jurisdictional ranges, status, and custom timeframes.'
  },
  {
    icon: ShieldAlert,
    title: 'Secure Archival Control',
    desc: 'Apply secure legal seals to compiled logs, establishing immutable audit trails compliance under Section 66 of IT Act, 2000.'
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, navigate]);
  return (
    <div className="home-page-container">
      {/* Animated digital canvas background */}
      <div className="home-grid-overlay" />
      <div className="home-glow-orb-1" />
      <div className="home-glow-orb-2" />
      <div className="home-glow-orb-3" />
      <div className="tech-scanline" />

      {/* Ticker Marquee Banner (Top scrolling ribbon) */}
      <div className="ticker-banner">
        <div className="ticker-text-wrapper">
          <span className="ticker-text">
            <span className="inline-flex items-center">
              <span className="helpline-badge">HELPLINE</span>
              <span>for Citizen : 1291 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Traffic : 1095, 25844444 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Missing Persons : 1094, 23241210 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Special Cell (North-East) : 1093</span>
            </span>
            <span className="inline-flex items-center">
              <span className="helpline-badge">HELPLINE</span>
              <span>for Citizen : 1291 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Traffic : 1095, 25844444 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Missing Persons : 1094, 23241210 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Special Cell (North-East) : 1093</span>
            </span>
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/60 z-10 min-h-[600px]">
        <div className="relative max-w-full mx-0 grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch min-h-[600px]">

          {/* Left: Commissioner Portrait Panel - flush to left edge, full height */}
          <div className="lg:col-span-4 flex flex-col relative z-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white border-r border-slate-200 shadow-2xl shadow-slate-900/10 w-full h-full overflow-hidden flex flex-col"
            >
              <img
                src={commissionerPhoto}
                alt="Sardar Vallabhbhai Patel"
                className="w-full flex-1 object-cover object-center"
                style={{ minHeight: '450px' }}
              />
              <div className="py-4 px-3 text-center bg-white border-t border-slate-100 flex-shrink-0">
                {/* <span className="text-xs font-black uppercase text-[#cca43b] tracking-wider block">MESSAGE FROM</span> */}
                <h3 className="text-base font-extrabold text-[#0d2a4a] mt-0.5 font-display">Sardar Vallabhbhai Patel</h3>
                <p className="text-[10px] text-slate-500 font-bold tracking-wide uppercase mt-0.5">First Home Minister of India</p>
              </div>
            </motion.div>
          </div>

          {/* Right: Existing Copy details */}
          <div className="lg:col-span-8 flex flex-col items-center lg:items-start text-center lg:text-left relative z-20 py-16 lg:py-24 px-8 lg:pl-12 lg:pr-16">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center lg:items-start"
            >
              {/* Delhi Police Hologram Badge */}
              <div className="mb-6">
                <div className="prism-hologram">
                  <img
                    src={delhiPoliceLogo}
                    alt="Delhi Police emblem"
                    className="hologram-crest"
                  />
                  <div className="hologram-text-block">
                    <span className="hologram-title">Delhi Police</span>
                    <div className="hologram-line" />
                    <span className="hologram-subtitle">SHANTI SEWA NYAYA</span>
                  </div>
                </div>
              </div>

              {/* Premium secure status badge */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider pulse-glow-badge text-[#cca43b]">
                  <span className="status-indicator-green" />
                  <Shield className="w-3.5 h-3.5" />
                  Delhi Police Official Portal
                </div>
              </div>

              <h1 className="text-6xl md:text-7xl font-black mb-4 tracking-tight leading-none font-display prism-logo-glow">
                PRISM
              </h1>
              <p className="text-xs md:text-sm lg:text-base font-bold text-[#cca43b] uppercase tracking-[0.22em] mb-6 font-sans">
                Police Reporting, Intelligence & Statistics Management
              </p>

              <p className="text-lg md:text-xl text-slate-700 font-light mb-8 max-w-3xl leading-relaxed">
                PRISM streamlines police operations by allowing officers to enter data once and have that information automatically populate all relevant records and reports. It generates comprehensive reports without manual formatting, supports layered approval workflows that reflect the Delhi Police command hierarchy, and provides district-wide analytics and dashboards to help commanders monitor performance, identify trends, and make data-driven decisions across the force.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full sm:w-auto relative z-20">
                <Button
                  size="lg"
                  as={Link}
                  to={ROUTES.LOGIN}
                  className="w-full sm:w-auto shadow-xl shadow-[#cca43b]/10 hover:shadow-[#cca43b]/20 hover:scale-[1.02] transition-all duration-200"
                >
                  Login Securely
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-24 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight font-display home-section-title">
              Operational Capabilities
            </h2>
            <p className="text-slate-600 text-sm md:text-base max-w-xl mx-auto font-light">
              Key integrated modules of the PRISM secure enterprise ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
              >
                <Card className="home-card-premium p-8 flex gap-5 h-full items-start">
                  <div className="p-3.5 rounded-xl bg-[#cca43b]/10 border border-[#cca43b]/20 text-[#cca43b] h-fit flex-shrink-0 shadow-lg shadow-[#cca43b]/5">
                    <Icon className="w-6 h-6 animate-pulse" style={{ animationDuration: '4s' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 font-display tracking-wide">{title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-light">{desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}
