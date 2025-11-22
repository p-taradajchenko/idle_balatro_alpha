import React from 'react';
import type { Card, Joker } from '../types';
import { PlayingCard } from './PlayingCard';

interface PackOpeningModalProps {
    isOpen: boolean;
    type: 'standard' | 'buffoon';
    options: (Card | Joker)[];
    onSelect: (index: number) => void;
    onSkip: () => void;
}

export const PackOpeningModal: React.FC<PackOpeningModalProps> = ({ isOpen, type, options, onSelect, onSkip }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col items-center gap-8">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">
                        {type === 'standard' ? 'Standard Pack' : 'Buffoon Pack'}
                    </h2>
                    <p className="text-slate-400">Choose 1 to add to your collection</p>
                </div>

                <div className="flex flex-wrap justify-center gap-6">
                    {options.map((option, i) => (
                        <div key={i} className="flex flex-col items-center gap-4 group">
                            <button
                                onClick={() => onSelect(i)}
                                className="relative transition-transform hover:-translate-y-2 hover:scale-105 active:scale-95"
                            >
                                {type === 'standard' ? (
                                    <PlayingCard card={option as Card} />
                                ) : (
                                    <div className="w-32 h-48 bg-slate-800 rounded-xl border-2 border-slate-600 flex flex-col p-3 relative overflow-hidden group-hover:border-blue-400 transition-colors">
                                        <div className="text-xs font-bold text-slate-500 uppercase mb-1">{(option as Joker).rarity}</div>
                                        <div className="text-lg font-bold text-white leading-tight mb-2">{(option as Joker).name}</div>
                                        <div className="flex-1 flex items-center justify-center">
                                            {/* Placeholder Art */}
                                            <div className="text-4xl">🃏</div>
                                        </div>
                                        <div className="text-xs text-slate-300 text-center mt-2">{(option as Joker).desc}</div>
                                    </div>
                                )}
                                <div className="absolute inset-0 ring-4 ring-blue-500/0 group-hover:ring-blue-500/50 rounded-xl transition-all"></div>
                            </button>
                            <button
                                onClick={() => onSelect(i)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-colors"
                            >
                                Select
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onSkip}
                    className="mt-4 text-slate-500 hover:text-slate-300 uppercase font-bold tracking-wider text-sm transition-colors"
                >
                    Skip Pack
                </button>
            </div>
        </div>
    );
};
