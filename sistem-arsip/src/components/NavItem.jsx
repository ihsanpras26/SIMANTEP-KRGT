import React from 'react';

const NavItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-primary-50 text-primary-600 shadow-soft border border-primary-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
    >
        {icon} <span>{label}</span>
    </button>
);

export default NavItem;
