import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Skull, BookOpen, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { ROUTES } from '../../utils/constants.js';

const stats = [
  { icon: BookOpen, label: 'Stories Published', value: '10,000+' },
  { icon: Users,    label: 'Active Readers',    value: '50,000+' },
  { icon: TrendingUp, label: 'Monthly Views',   value: '2M+' },
];

const genres = [
  { name: 'True Crime',     desc: 'Real cases, raw details',   color: 'from-red-900/50 to-red-800/20',    border: 'border-red-800/40' },
  { name: 'Mystery',        desc: 'Unravel the unknown',        color: 'from-violet-900/50 to-violet-800/20', border: 'border-violet-800/40' },
  { name: 'Thriller',       desc: 'Heart-pounding suspense',    color: 'from-amber-900/50 to-amber-800/20',  border: 'border-amber-800/40' },
  { name: 'Crime Fiction',  desc: 'Masterful storytelling',     color: 'from-blue-900/50 to-blue-800/20',    border: 'border-blue-800/40' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden py-32 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-zinc-950 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium">
              <Skull className="w-4 h-4" />
              The darkest stories live here
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-zinc-100 mb-6 tracking-tight leading-tight">
              Dive Into the
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400"> Darkness</span>
            </h1>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Crime Diaries is home to thousands of crime fiction stories, true crime analyses, and mystery narratives from writers around the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" as={Link} to={ROUTES.REGISTER}>
                Start Reading Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" as={Link} to="/stories">
                Browse Stories
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 border-y border-zinc-800">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {stats.map(({ icon: Icon, label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Icon className="w-6 h-6 text-violet-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-zinc-100">{value}</div>
              <div className="text-sm text-zinc-500 mt-1">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Genres */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-100 mb-3">Explore by Genre</h2>
            <p className="text-zinc-500">Find your perfect dark read</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {genres.map(({ name, desc, color, border }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
              >
                <Link
                  to={`/genres/${name.toLowerCase().replace(' ', '-')}`}
                  className={`block p-6 rounded-2xl bg-gradient-to-br ${color} border ${border} hover:border-opacity-80 transition-all duration-300 group`}
                >
                  <h3 className="text-lg font-semibold text-zinc-100 mb-1 group-hover:text-white">{name}</h3>
                  <p className="text-sm text-zinc-400">{desc}</p>
                  <ArrowRight className="w-4 h-4 text-zinc-500 mt-4 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
