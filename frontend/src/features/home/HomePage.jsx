import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, FileText, Database, ShieldAlert, Cpu, ArrowRight, ClipboardCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { ROUTES } from '../../utils/constants.js';
import delhiPoliceLogo from '../../assets/delhi_police_logo.png';
import useAuthStore from '../../store/authStore.js';

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 px-4 border-b border-zinc-900">
        {/* Background visual graphics */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-zinc-950 to-zinc-950 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Delhi Police Crest Emblem */}
            <img 
              src={delhiPoliceLogo} 
              alt="Delhi Police emblem" 
              className="w-24 h-24 mx-auto mb-6 object-contain filter drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4))"
            />

            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#cca43b] text-sm font-medium uppercase tracking-wide">
              <Shield className="w-4 h-4" />
              NCT of Delhi Government Portal
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-zinc-100 mb-4 tracking-tight leading-none font-display">
              PRISM
            </h1>
            <p className="text-sm font-bold text-[#cca43b] uppercase tracking-widest mb-6 font-sans">
              Police Reporting, Intelligence & Statistics Management
            </p>
            
            <p className="text-lg text-zinc-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              PRISM enables single-point data entry, automated report generation, hierarchical approvals, and district-wide analytics for the Delhi Police command structures.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" as={Link} to={ROUTES.LOGIN}>
                Access Secure Console
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" as={Link} to={ROUTES.LOGIN}>
                Authorized Officer Login
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-24 px-4 bg-zinc-950/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-100 mb-3 font-display">Operational Capabilities</h2>
            <p className="text-zinc-500 text-sm">Key integrated modules of the PRISM secure ecosystem</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 border-zinc-800 bg-zinc-900/40 flex gap-4 h-full">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#cca43b] h-fit flex-shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100 mb-2 font-display">{title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security notice / Legal details */}
      <section id="security" className="py-16 px-4 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto text-center border border-red-900/30 bg-red-950/5 p-8 rounded-2xl">
          <Cpu className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-200 mb-2 font-display">Secure Audit Monitoring Notice</h3>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-4">
            This is an official computing system of the Government of National Capital Territory of Delhi (India). Every attempt to login, modify entries, query records, or bypass controls is subject to real-time logging, IP auditing, and PIS badge identification checks.
          </p>
          <div className="text-xs text-red-500/90 font-medium">
            Unauthorized intrusion, data extraction, or modification violates Section 66 of IT Act, 2000 and the Indian Penal Code.
          </div>
        </div>
      </section>

    </div>
  );
}
