// path: src/components/layout/LandingIntro.tsx
import { motion } from 'framer-motion';
import { GitBranch, MousePointerClick, PencilLine, FlaskConical, X } from 'lucide-react';

interface LandingIntroProps {
  onClose: () => void;
}

const FEATURES = [
  {
    icon: GitBranch,
    title: 'Miller Column Drill-down',
    description: 'Dive deeper column by column to intuitively explore JSON structures.',
  },
  {
    icon: MousePointerClick,
    title: 'Reference Tracking',
    description: 'Automatically detects ObjectId and reference fields, jumping to linked documents with a single click.',
  },
  {
    icon: PencilLine,
    title: 'Inline Editing',
    description: 'Double-click to edit values instantly, with full Undo support.',
  },
  {
    icon: FlaskConical,
    title: 'Mock Data Prototyping',
    description: 'A project that validates UI with shared-type mock data before wiring up the real API.',
  },
] as const;

const TECH_STACK = ['React 18', 'TypeScript', 'Vite', 'TailwindCSS', 'Framer Motion'] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

export function LandingIntro({ onClose }: LandingIntroProps) {
  return (
    <section className="relative flex-1 flex-col w-full px-6 py-24 sm:px-10 lg:px-20">
      <button
        type="button"
        className="absolute top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
        onClick={onClose}
        aria-label="Dismiss intro section"
        title="Dismiss intro section"
      >
        <X size={16} />
      </button>

      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <motion.span
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700"
        >
          JSON Explorer & Editor
        </motion.span>

        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex flex-col items-center mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
        >
          Miller Column으로 탐색하는
          <br className="hidden sm:block" />
          가장 직관적인 JSON 뷰어
          <div className="mt-5 h-1 w-16 rounded-full bg-emerald-400/25" />
        </motion.h2>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 max-w-2xl text-base leading-relaxed text-slate-500"
        >
          A free JSON explorer for developers working with MongoDB and Firestore data. Reference tracking, inline editing,
          and mock-data-based prototyping — all in one screen.
        </motion.p>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, description }, index) => (
          <motion.div
            key={title}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel transition-transform hover:-translate-y-1"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-emerald-50 text-emerald-600">
              <Icon size={20} strokeWidth={2} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.6 }}
        variants={fadeUp}
        transition={{ duration: 0.5 }}
        className="mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-400"
      >
        {TECH_STACK.map((tech) => (
          <span key={tech} className="rounded-full border border-slate-200 bg-white px-3 py-1">
            {tech}
          </span>
        ))}
      </motion.div>
    </section>
  );
}
