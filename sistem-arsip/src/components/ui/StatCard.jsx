import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Card } from './Card';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'blue',
  className,
  ...props 
}) => {
  const colorVariants = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'text-blue-500'
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'text-green-500'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      icon: 'text-purple-500'
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      icon: 'text-orange-500'
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'text-red-500'
    },
    primary: {
      gradient: 'from-primary-500 to-primary-600',
      bg: 'bg-primary-50',
      text: 'text-primary-600',
      icon: 'text-primary-500'
    }
  };

  const colors = colorVariants[color] || colorVariants.primary;

  return (
    <Card 
      className={cn('relative overflow-hidden group', className)} 
      {...props}
    >
      {/* Background Gradient */}
      <div className={cn(
        'absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full -translate-y-8 translate-x-8 group-hover:opacity-10 transition-opacity duration-300',
        colors.gradient
      )} />
      
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
            </p>
            
            {trend && trendValue && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <TrendingUp className="text-green-500 mr-1" size={16} />
                ) : (
                  <TrendingDown className="text-red-500 mr-1" size={16} />
                )}
                <span className={cn(
                  'text-sm font-medium',
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                )}>
                  {trendValue}%
                </span>
                <span className="text-sm text-gray-500 ml-1">dari bulan lalu</span>
              </div>
            )}
          </div>
          
          <div 
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              colors.bg
            )}
          >
            <Icon className={colors.icon} size={24} />
          </div>
        </div>
      </div>
      
      {/* Hover Effect */}
      <div 
        className={cn(
          'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          colors.gradient
        )}
      />
    </Card>
  );
};

export { StatCard };