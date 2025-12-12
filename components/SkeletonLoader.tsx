import { motion } from "framer-motion";

export function SkeletonLoader() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, index) => (
        <motion.div
          // brief comment: animate shimmer cards to keep dashboard lively while waiting
          key={index}
          className="h-24 w-full rounded-2xl bg-slate-100 shimmer animate-shimmer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      ))}
    </div>
  );
}
