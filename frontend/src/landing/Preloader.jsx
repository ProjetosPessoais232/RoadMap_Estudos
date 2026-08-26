import { motion } from 'framer-motion'

export default function Preloader() {
  return (
    <motion.div
      className="landing-preloader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col items-center gap-6">
        <img src="/logo.png" alt="" className="h-20 w-20 object-contain landing-preloader-logo" />
        <p className="font-display text-lg font-semibold tracking-tight">Paperless</p>
        <div className="landing-preloader-bar" />
      </div>
    </motion.div>
  )
}
