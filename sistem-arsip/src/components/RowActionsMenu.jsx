import React from 'react';
import { MoreVertical, Eye, Edit, Trash2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RowActionsMenu({ item, onView, onEdit, onManageLabels, onDelete }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const menuRef = React.useRef(null);

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const actions = [
        {
            label: 'Lihat Detail',
            icon: Eye,
            onClick: () => {
                onView(item);
                setIsOpen(false);
            },
            color: 'text-neutral-700 hover:bg-primary-50 hover:text-primary-700'
        },
        {
            label: 'Edit',
            icon: Edit,
            onClick: () => {
                onEdit(item);
                setIsOpen(false);
            },
            color: 'text-neutral-700 hover:bg-amber-50 hover:text-amber-700'
        },
        {
            label: 'Kelola Label',
            icon: Tag,
            onClick: () => {
                onManageLabels(item);
                setIsOpen(false);
            },
            color: 'text-neutral-700 hover:bg-purple-50 hover:text-purple-700'
        },
        {
            type: 'divider'
        },
        {
            label: 'Hapus',
            icon: Trash2,
            onClick: () => {
                onDelete(item);
                setIsOpen(false);
            },
            color: 'text-red-600 hover:bg-red-50 hover:text-red-700'
        }
    ];

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                aria-label="More actions"
            >
                <MoreVertical size={16} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-neutral-200 py-1 z-50"
                    >
                        {actions.map((action, idx) => {
                            if (action.type === 'divider') {
                                return (
                                    <div
                                        key={`divider-${idx}`}
                                        className="h-px bg-neutral-200 my-1"
                                    />
                                );
                            }

                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.label}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        action.onClick();
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${action.color}`}
                                >
                                    <Icon size={16} />
                                    <span>{action.label}</span>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
