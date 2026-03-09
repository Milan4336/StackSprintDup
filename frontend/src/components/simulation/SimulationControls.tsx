import { motion } from 'framer-motion';
import { SimulationControlCenter } from '../SimulationControlCenter';

export const SimulationControls = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.06 }}
    >
      <SimulationControlCenter />
    </motion.div>
  );
};
