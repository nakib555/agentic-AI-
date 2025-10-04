/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, MotionProps } from 'framer-motion';

const animationProps: MotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

export const UserMessage = ({ text }: { text: string }) => {
  return (
    <motion.div {...animationProps} className="w-full flex justify-end">
      <div className="max-w-[85%] sm:max-w-2xl w-fit p-3 sm:p-4 rounded-2xl bg-teal-600 text-white rounded-br-none shadow-sm break-words">
        {text}
      </div>
    </motion.div>
  );
};