import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <div className="w-full">
      <div className="mx-auto flex w-full flex-col items-center py-6 sm:py-12">
        <div className="mb-5 flex w-full max-w-5xl flex-col items-center sm:mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-center text-gray-800 font-black leading-7 md:leading-10"
          >
            Spread and Share some <br />
            <span className="text-amber-300"> Giggles </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-5 max-w-4xl sm:mt-10 text-center text-md font-normal text-gray-400 sm:text-lg"
          >
            At Giggles Foundation, our mission is to empower underprivileged
            children through education and healthcare. We believe that every
            child deserves access to quality education and healthcare services,
            regardless of their background or circumstances. By providing
            essential resources and support, we aim to break the cycle of
            poverty and inequality, enabling children to reach their full
            potential and contribute positively to their communities
          </motion.p>
        </div>
      </div>
    </div>
  );
}
