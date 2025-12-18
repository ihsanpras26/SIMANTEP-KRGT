import React from 'react';
import { cn } from '../utils/cn';

export default function SkeletonArsipList({ viewMode = 'table' }) {
    // Generate array of dummy items
    const items = Array.from({ length: 6 });

    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {items.map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm h-[200px] flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="h-6 w-10 bg-neutral-200 rounded-md"></div>
                                <div className="h-6 w-24 bg-neutral-200 rounded-full"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-6 w-3/4 bg-neutral-200 rounded-md"></div>
                                <div className="h-4 w-1/2 bg-neutral-100 rounded-md"></div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-8 w-20 bg-neutral-100 rounded-lg"></div>
                            <div className="h-8 w-20 bg-neutral-100 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden animate-pulse">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50/50">
                            <th className="p-4 w-[50px]"><div className="h-4 w-4 bg-neutral-200 rounded"></div></th>
                            <th className="p-4 w-[150px]"><div className="h-4 w-24 bg-neutral-200 rounded"></div></th>
                            <th className="p-4"><div className="h-4 w-32 bg-neutral-200 rounded"></div></th>
                            <th className="p-4 w-[180px]"><div className="h-4 w-24 bg-neutral-200 rounded"></div></th>
                            <th className="p-4 w-[150px]"><div className="h-4 w-20 bg-neutral-200 rounded"></div></th>
                            <th className="p-4 w-[100px]"><div className="h-4 w-12 bg-neutral-200 rounded"></div></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((_, i) => (
                            <tr key={i} className="border-b border-neutral-50 last:border-none">
                                <td className="p-4"><div className="h-4 w-4 bg-neutral-100 rounded"></div></td>
                                <td className="p-4">
                                    <div className="space-y-2">
                                        <div className="h-4 w-28 bg-neutral-200 rounded"></div>
                                        <div className="h-3 w-20 bg-neutral-100 rounded"></div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="space-y-2">
                                        <div className="h-5 w-3/4 bg-neutral-200 rounded"></div>
                                        <div className="h-3 w-1/2 bg-neutral-100 rounded"></div>
                                    </div>
                                </td>
                                <td className="p-4"><div className="h-4 w-24 bg-neutral-100 rounded"></div></td>
                                <td className="p-4">
                                    <div className="flex gap-1">
                                        <div className="h-5 w-16 bg-neutral-100 rounded-full"></div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <div className="h-8 w-8 bg-neutral-100 rounded"></div>
                                        <div className="h-8 w-8 bg-neutral-100 rounded"></div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
