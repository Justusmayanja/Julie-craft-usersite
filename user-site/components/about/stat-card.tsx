"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { AnimatedNumber } from "./animated-number"

interface StatCardProps {
  number: string
  label: string
  icon?: LucideIcon
  index: number
  delay?: number
}

export function StatCard({ number, label, icon: Icon, index, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: delay + index * 0.1,
        ease: [0.16, 1, 0.3, 1] // Custom easing for smooth animation
      }}
      className="h-full w-full min-w-0"
    >
      <div
        className="
          h-full
          w-full
          flex flex-col items-center justify-center
          p-6 sm:p-8 lg:p-10
          bg-white
          rounded-2xl
          shadow-sm
          transition-all duration-300
          border border-slate-100
          lg:hover:shadow-md
          lg:hover:-translate-y-1
          min-w-0
        "
      >
        {Icon && (
          <div className="mb-4 sm:mb-6 flex items-center justify-center flex-shrink-0">
            <div className="
              inline-flex items-center justify-center
              w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16
              rounded-xl
              bg-gradient-to-br from-amber-400 to-orange-500
              shadow-lg
            ">
              <Icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" aria-hidden="true" />
            </div>
          </div>
        )}
        
        <div className="text-center w-full min-w-0 px-2 flex-1 flex flex-col justify-center">
          <div className="
            text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl
            font-bold
            text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600
            mb-2 sm:mb-3
            tabular-nums
            leading-tight
            w-full
            overflow-hidden
            px-2
          ">
            <AnimatedNumber value={number} duration={2000} />
          </div>
          
          <p className="
            text-sm sm:text-base lg:text-lg
            font-semibold
            text-slate-700
            leading-tight
            px-1
            break-words
          ">
            {label}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

