import { motion } from "framer-motion";

interface AnimatedCardProps {
  title: string;
  description: string;
  icon: string;
}

export default function AnimatedCard({ title, description, icon }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-shadow"
    >
      <div 
        className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-6" 
        dangerouslySetInnerHTML={{ __html: icon }} 
      />
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

