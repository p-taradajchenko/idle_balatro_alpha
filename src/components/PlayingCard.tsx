import React from 'react';
import type { Card as CardType } from '../types';
import clsx from 'clsx';
import { Heart, Diamond, Club, Spade } from 'lucide-react';

interface PlayingCardProps {
    card: CardType;
    isScoring?: boolean;
    isDraggable?: boolean;
    onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({ card, isScoring = false, isDraggable = false, onDragStart }) => {
    const getEnhancementStyle = () => {
        if (card.enhancement === 'stone') return 'bg-stone-400 border-stone-600 text-transparent';
        if (card.enhancement === 'gold') return 'bg-yellow-100 border-yellow-500';
        if (card.enhancement === 'glass') return 'bg-white/50 backdrop-blur-sm border-white/80';
        if (card.enhancement === 'steel') return 'bg-slate-300 border-slate-500';
        return 'bg-white';
    };

    const getEditionStyle = () => {
        if (card.edition === 'foil') return 'shadow-[0_0_10px_2px_rgba(100,100,255,0.5)] border-blue-400';
        if (card.edition === 'holographic') return 'shadow-[0_0_10px_2px_rgba(255,100,100,0.5)] border-red-400';
        if (card.edition === 'polychrome') return 'shadow-[0_0_10px_2px_rgba(255,255,255,0.8)] border-purple-400 animate-pulse';
        return '';
    };

    const renderSuitIcon = () => {
        const className = clsx("w-4 h-4", card.color === 'red' ? "fill-red-500 text-red-500" : "fill-slate-800 text-slate-800");
        switch (card.suit) {
            case 'hearts': return <Heart className={className} />;
            case 'diamonds': return <Diamond className={className} />;
            case 'clubs': return <Club className={className} />;
            case 'spades': return <Spade className={className} />;
            default: return null;
        }
    };

    return (
        <div
            draggable={isDraggable}
            onDragStart={onDragStart}
            className={clsx(
                "w-24 h-36 rounded-xl border-2 flex flex-col items-center justify-between p-2 select-none transition-transform hover:-translate-y-2 relative overflow-hidden",
                getEnhancementStyle(),
                getEditionStyle(),
                isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
                isScoring && "ring-4 ring-yellow-400 card-glow"
            )}
        >
            {/* Stone Card Mask */}
            {card.enhancement === 'stone' && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-400 z-10">
                    <span className="text-4xl font-bold text-stone-700">?</span>
                </div>
            )}

            <div className={clsx("text-xl font-bold self-start", card.color === 'red' ? "text-red-600" : "text-slate-900")}>
                {card.rankLabel}
            </div>
            <div className="text-4xl">
                {renderSuitIcon()}
            </div>
            <div className={clsx("text-xl font-bold self-end rotate-180", card.color === 'red' ? "text-red-600" : "text-slate-900")}>
                {card.rankLabel}
            </div>

            {/* Enhancement Label */}
            {card.enhancement && card.enhancement !== 'none' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none uppercase font-black text-xs tracking-widest">
                    {card.enhancement}
                </div>
            )}
        </div>
    );
};
