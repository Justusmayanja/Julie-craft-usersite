"use client"

import { LucideIcon } from "lucide-react"
import { StatCard } from "./stat-card"

interface StatItem {
  number: string
  label: string
  icon?: LucideIcon
}

interface StatsSectionProps {
  title?: string
  subtitle?: string
  stats: StatItem[]
  className?: string
}

export function StatsSection({ 
  title = "Making a Difference", 
  subtitle,
  stats,
  className = ""
}: StatsSectionProps) {
  if (!stats || stats.length === 0) {
    return null
  }

  return (
    <section className={`mb-20 sm:mb-24 lg:mb-32 ${className}`}>
      <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        
        <div className="relative z-10">
          {/* Header */}
          {(title || subtitle) && (
            <div className="text-center mb-12">
              {title && (
                <h2 className="
                  text-3xl sm:text-4xl lg:text-5xl
                  font-bold
                  text-slate-900
                  mb-4
                ">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="
                  text-lg sm:text-xl
                  text-slate-700
                  max-w-3xl mx-auto
                  leading-relaxed
                ">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div className="
            max-w-7xl
            mx-auto
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-2
            xl:grid-cols-4
            gap-6
            sm:gap-6
            lg:gap-8
            auto-rows-fr
          ">
            {stats.map((stat, index) => (
              <StatCard
                key={`${stat.number}-${stat.label}-${index}`}
                number={stat.number}
                label={stat.label}
                icon={stat.icon}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

