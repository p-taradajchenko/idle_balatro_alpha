import React, { useState, useEffect, useRef } from 'react';
import { Heart, Diamond, Club, Spade, Zap, ShoppingBag, RefreshCw, Unlock, Trophy, Trash2, Layers } from 'lucide-react';

// --- CONSTANTS & DATA ---

const SUITS = [
    { type: 'hearts', icon: <Heart className="w-4 h-4 fill-red-500 text-red-500" />, color: 'red' },
    { type: 'diamonds', icon: <Diamond className="w-4 h-4 fill-red-500 text-red-500" />, color: 'red' },
    { type: 'clubs', icon: <Club className="w-4 h-4 fill-slate-800 text-slate-800" />, color: 'black' },
    { type: 'spades', icon: <Spade className="w-4 h-4 fill-slate-800 text-slate-800" />, color: 'black' },
];

const RANKS = [
    { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 },
    { label: '5', value: 5 }, { label: '6', value: 6 }, { label: '7', value: 7 },
    { label: '8', value: 8 }, { label: '9', value: 9 }, { label: '10', value: 10 },
    { label: 'J', value: 10 }, { label: 'Q', value: 10 }, { label: 'K', value: 10 },
    { label: 'A', value: 11 },
];

const HAND_TYPES = {
    HIGH_CARD: { name: 'High Card', chips: 5, mult: 1 },
    PAIR: { name: 'Pair', chips: 10, mult: 2 },
    TWO_PAIR: { name: 'Two Pair', chips: 20, mult: 2 },
    THREE_OF_A_KIND: { name: 'Three of a Kind', chips: 30, mult: 3 },
    STRAIGHT: { name: 'Straight', chips: 30, mult: 4 },
    FLUSH: { name: 'Flush', chips: 35, mult: 4 },
    FULL_HOUSE: { name: 'Full House', chips: 40, mult: 4 },
    FOUR_OF_A_KIND: { name: 'Four of a Kind', chips: 60, mult: 7 },
    STRAIGHT_FLUSH: { name: 'Straight Flush', chips: 100, mult: 8 },
    ROYAL_FLUSH: { name: 'Royal Flush', chips: 100, mult: 8 },
};

const JOKERS_SHOP = [
    { id: 'j_joker', name: 'Joker', desc: '+4 Mult', cost: 2, type: 'mult', val: 4 },
    { id: 'j_greedy', name: 'Greedy Joker', desc: 'Played cards with Diamond suit give +4 Mult', cost: 5, type: 'suit_mult', suit: 'diamonds', val: 4 },
    { id: 'j_lusty', name: 'Lusty Joker', desc: 'Played cards with Heart suit give +4 Mult', cost: 5, type: 'suit_mult', suit: 'hearts', val: 4 },
    { id: 'j_wrathful', name: 'Wrathful Joker', desc: 'Played cards with Spade suit give +4 Mult', cost: 5, type: 'suit_mult', suit: 'spades', val: 4 },
    { id: 'j_gluttenous', name: 'Gluttonous Joker', desc: 'Played cards with Club suit give +4 Mult', cost: 5, type: 'suit_mult', suit: 'clubs', val: 4 },
    { id: 'j_sly', name: 'Sly Joker', desc: '+50 Chips if Pair', cost: 4, type: 'hand_chip', hand: 'PAIR', val: 50 },
    { id: 'j_banner', name: 'Banner', desc: '+40 Chips for each remaining discard (mock)', cost: 6, type: 'flat_chip', val: 40 },
    { id: 'j_cavendish', name: 'Gros Michel', desc: '+15 Mult, 1 in 10 chance to die per blind', cost: 5, type: 'mult', val: 15, perishable: true },
];

// --- UTILS ---

const getRandomCard = () => {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    return {
        id: Math.random().toString(36).substr(2, 9),
        suit: suit.type,
        rankLabel: rank.label,
        value: rank.value,
        suitIcon: suit.icon,
        color: suit.color
    };
};

// Helper to evaluate poker hand
const evaluateHand = (cards) => {
    const validCards = cards.filter(c => c !== null && c !== undefined);
    if (validCards.length === 0) return { type: HAND_TYPES.HIGH_CARD, scoringCards: [] };

    const rankOrder = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

    const sorted = [...validCards].sort((a, b) => rankOrder[a.rankLabel] - rankOrder[b.rankLabel]);
    const ranks = sorted.map(c => rankOrder[c.rankLabel]);
    const suits = sorted.map(c => c.suit);

    const isFlush = suits.length >= 5 && suits.every(s => s === suits[0]);

    let isStraight = false;
    if (ranks.length >= 5) {
        isStraight = true;
        for (let i = 0; i < ranks.length - 1; i++) {
            if (ranks[i] + 1 !== ranks[i + 1]) isStraight = false;
        }
        if (!isStraight && ranks.join(',').endsWith('2,3,4,5,14')) isStraight = true; // A-5 straight check
    }

    const counts = {};
    ranks.forEach(r => { counts[r] = (counts[r] || 0) + 1; });
    const countValues = Object.values(counts).sort((a, b) => b - a);

    if (isFlush && isStraight && ranks[ranks.length - 1] === 14) return { type: HAND_TYPES.ROYAL_FLUSH, scoringCards: sorted };
    if (isFlush && isStraight) return { type: HAND_TYPES.STRAIGHT_FLUSH, scoringCards: sorted };
    if (countValues[0] === 4) return { type: HAND_TYPES.FOUR_OF_A_KIND, scoringCards: sorted };
    if (countValues[0] === 3 && countValues[1] === 2) return { type: HAND_TYPES.FULL_HOUSE, scoringCards: sorted };
    if (isFlush) return { type: HAND_TYPES.FLUSH, scoringCards: sorted };
    if (isStraight) return { type: HAND_TYPES.STRAIGHT, scoringCards: sorted };
    if (countValues[0] === 3) return { type: HAND_TYPES.THREE_OF_A_KIND, scoringCards: sorted };
    if (countValues[0] === 2 && countValues[1] === 2) return { type: HAND_TYPES.TWO_PAIR, scoringCards: sorted };
    if (countValues[0] === 2) return { type: HAND_TYPES.PAIR, scoringCards: sorted };

    return { type: HAND_TYPES.HIGH_CARD, scoringCards: [sorted[sorted.length - 1]] };
};

// --- COMPONENT ---

export default function IdleBalatro() {
    // -- STATE --
    const [chips, setChips] = useState(0);
    const [money, setMoney] = useState(0);
    const [ante, setAnte] = useState(1);
    const [blindProgress, setBlindProgress] = useState(0);
    const [blindGoal, setBlindGoal] = useState(300);

    const [maxSlots, setMaxSlots] = useState(1);
    const [maxJokers, setMaxJokers] = useState(3);

    // Table Cards (Fixed slots, can be null)
    const [tableCards, setTableCards] = useState([null, null, null, null, null]);

    // Hand Cards (Array of cards)
    const [handCards, setHandCards] = useState([]);
    const [maxHandSize, setMaxHandSize] = useState(7);

    const [jokers, setJokers] = useState([]);
    const [drawCost, setDrawCost] = useState(0);

    const [draggedCardIndex, setDraggedCardIndex] = useState(null);

    // Calculations for UI
    const [currentHand, setCurrentHand] = useState(HAND_TYPES.HIGH_CARD);
    const [cps, setCps] = useState(0);
    const [lastHandScore, setLastHandScore] = useState({ chips: 0, mult: 0 });

    // -- GAME LOOP --
    useEffect(() => {
        const tickRate = 1000;
        const interval = setInterval(() => {
            const evaluation = evaluateHand(tableCards);
            setCurrentHand(evaluation.type);

            let handChips = evaluation.type.chips;
            let handMult = evaluation.type.mult;

            evaluation.scoringCards.forEach(card => {
                handChips += card.value;
            });

            jokers.forEach(joker => {
                if (joker.type === 'mult') handMult += joker.val;
                if (joker.type === 'flat_chip') handChips += joker.val;
                if (joker.type === 'hand_chip' && evaluation.type.name.toUpperCase() === joker.hand) handChips += joker.val;
                if (joker.type === 'suit_mult') {
                    if (evaluation.scoringCards.some(c => c.suit === joker.suit)) {
                        handMult += joker.val;
                    }
                }
            });

            const score = Math.floor(handChips * handMult);
            setLastHandScore({ chips: handChips, mult: handMult });
            setCps(score);

            setBlindProgress(prev => {
                const newVal = prev + score;
                if (newVal >= blindGoal) {
                    handleBlindDefeated(newVal - blindGoal);
                    return 0;
                }
                return newVal;
            });

            setChips(prev => prev + Math.floor(score * 0.5));

        }, tickRate);

        return () => clearInterval(interval);
    }, [tableCards, jokers, blindGoal]);

    const handleBlindDefeated = (overflow) => {
        const interest = Math.min(Math.floor(money / 5), 5);
        const payout = 4 + interest;
        setMoney(prev => prev + payout);
        setAnte(prev => prev + 1);
        setBlindGoal(prev => Math.floor(prev * 1.8));
        setDrawCost(prev => Math.max(0, Math.floor(prev / 2)));

        setJokers(prev => prev.filter(j => {
            if (j.perishable) {
                return Math.random() > 0.1;
            }
            return true;
        }));
    };

    // -- ACTIONS --

    const drawCardToHand = () => {
        if (chips < drawCost || handCards.length >= maxHandSize) return;
        setChips(prev => prev - drawCost);
        setDrawCost(prev => prev === 0 ? 5 : Math.floor(prev * 1.5));

        const newCard = getRandomCard();
        setHandCards(prev => [...prev, newCard]);
    };

    const buySlot = () => {
        const cost = 100 * Math.pow(10, maxSlots - 1);
        if (chips >= cost && maxSlots < 5) {
            setChips(prev => prev - cost);
            setMaxSlots(prev => prev + 1);
        }
    };

    const buyJoker = (jokerTemplate) => {
        if (money >= jokerTemplate.cost && jokers.length < maxJokers) {
            setMoney(prev => prev - jokerTemplate.cost);
            setJokers(prev => [...prev, { ...jokerTemplate, uid: Math.random() }]);
        }
    };

    const sellJoker = (index) => {
        const joker = jokers[index];
        setMoney(prev => prev + Math.floor(joker.cost / 2));
        setJokers(prev => prev.filter((_, i) => i !== index));
    };

    // -- DRAG AND DROP LOGIC --

    const handleDragStart = (e, index) => {
        setDraggedCardIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Ghost image or just standard default
    };

    const handleDropOnSlot = (e, slotIndex) => {
        e.preventDefault();
        if (draggedCardIndex === null) return;
        if (slotIndex >= maxSlots) return; // Locked slot

        const cardToPlay = handCards[draggedCardIndex];

        setTableCards(prev => {
            const newTable = [...prev];
            newTable[slotIndex] = cardToPlay; // Replaces existing card if any
            return newTable;
        });

        setHandCards(prev => prev.filter((_, i) => i !== draggedCardIndex));
        setDraggedCardIndex(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const getSlotCost = () => 100 * Math.pow(10, maxSlots - 1);

    // -- CARD RENDERER --
    const Card = ({ card, isSmall = false }) => (
        <div className= {`bg-white shadow-md border-2 border-slate-300 flex flex-col items-center justify-between select-none ${isSmall ? 'w-16 h-24 p-1 text-sm rounded-lg' : 'w-24 h-36 p-2 rounded-xl'}`
}>
    <div className={ `self-start font-bold flex items-center gap-1 ${card.color === 'red' ? 'text-red-600' : 'text-slate-900'}` }>
        { card.rankLabel }
        < div className = { isSmall? "w-3 h-3": "w-4 h-4" } > { card.suitIcon } </div>
            </div>
            < div className = { isSmall? "text-2xl": "text-4xl" } > { card.suitIcon } </div>
                < div className = {`self-end font-bold flex items-center gap-1 rotate-180 ${card.color === 'red' ? 'text-red-600' : 'text-slate-900'}`}>
                    { card.rankLabel }
                    < div className = { isSmall? "w-3 h-3": "w-4 h-4" } > { card.suitIcon } </div>
                        </div>
                        </div>
  );

return (
    <div className= "min-h-screen bg-slate-900 text-slate-100 font-mono p-4 flex flex-col gap-4 select-none" >

    {/* TOP BAR */ }
    < div className = "grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800 p-3 rounded-xl shadow-xl border-b-4 border-slate-950" >
        <div className="flex flex-col justify-center" >
            <div className="text-xs text-slate-400 uppercase tracking-wider" > Current Ante </div>
                < div className = "text-2xl font-bold text-orange-400 flex items-center gap-2" >
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm shadow-inner" >
                        { ante }
                        </div>
                        < span > Big Blind </span>
                            </div>
                            </div>

                            < div className = "flex flex-col justify-center items-center" >
                                <div className="text-xs text-slate-400 mb-1" > Blind Progress </div>
                                    < div className = "w-full h-6 bg-slate-950 rounded-full overflow-hidden relative border border-slate-700" >
                                        <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 ease-linear"
style = {{ width: `${Math.min(100, (blindProgress / blindGoal) * 100)}%` }}
                 />
    < div className = "absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md" >
        { Math.floor(blindProgress) } / { blindGoal }
        </div>
        </div>
        < div className = "text-xs text-blue-300 mt-1 flex gap-2" >
            <span>{ cps } / sec </span>
            < span className = "text-slate-500" >| </span>
                < span > Reward: ${ 4 + Math.min(Math.floor(money / 5), 5) } </span>
                    </div>
                    </div>

                    < div className = "flex flex-col justify-center items-end gap-1" >
                        <div className="flex items-center gap-2" >
                            <span className="text-xs text-blue-400" > Chips </span>
                                < span className = "text-lg font-bold text-white bg-blue-900/50 px-2 py-0.5 rounded border border-blue-700" >
                                    { chips.toLocaleString() }
                                    </span>
                                    </div>
                                    < div className = "flex items-center gap-2" >
                                        <span className="text-xs text-yellow-400" > Money </span>
                                            < span className = "text-lg font-bold text-white bg-yellow-900/50 px-2 py-0.5 rounded border border-yellow-700" >
                                                ${ money }
</span>
    </div>
    </div>
    </div>

{/* MAIN GAME LAYOUT */ }
<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1" >

    {/* LEFT: GAMEPLAY AREA */ }
    < div className = "lg:col-span-8 flex flex-col gap-4" >

        {/* SCORE & JOKERS */ }
        < div className = "flex flex-col md:flex-row gap-4" >
            {/* SCORE */ }
            < div className = "flex-1 bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center justify-between" >
                <div>
                <div className="text-xs text-slate-400 uppercase" > Current Hand </div>
                    < div className = "text-xl font-bold text-white" > { currentHand.name } </div>
                        </div>
                        < div className = "flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg border border-slate-600" >
                            <span className="text-blue-400 font-bold text-xl" > { lastHandScore.chips } </span>
                                < span className = "text-slate-500 text-xs" > X </span>
                                    < span className = "text-red-500 font-bold text-xl" > { lastHandScore.mult } </span>
                                        </div>
                                        </div>

{/* JOKERS */ }
<div className="flex-[2] bg-slate-800 p-2 rounded-xl border border-slate-700 overflow-x-auto flex items-center gap-2 min-h-[100px]" >
    { jokers.length === 0 && <div className="text-slate-500 text-xs italic w-full text-center"> Jokers appear here</ div >}
{
    jokers.map((joker, idx) => (
        <div key= { joker.uid } className = "relative group shrink-0" >
        <div className="w-14 h-20 bg-slate-700 border border-slate-500 rounded flex flex-col items-center justify-center p-1 text-center shadow-md" >
    <div className="text-[10px] font-bold text-yellow-400 leading-none mb-1" > { joker.name } </div>
    < div className = "text-[8px] text-slate-300 leading-none" > { joker.desc } </div>
    </div>
    < button onClick = {() => sellJoker(idx)} className = "absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100" >
        <Trash2 className="w-3 h-3" />
            </button>
            </div>
                    ))}
</div>
    </div>

{/* THE TABLE (DROP ZONES) */ }
<div className="flex-1 bg-green-900/30 p-4 rounded-2xl border-4 border-green-900 relative flex items-center justify-center gap-2 flex-wrap shadow-inner min-h-[200px]" >
    <div className="absolute top-0 left-0 bg-green-900 text-green-200 px-3 py-1 rounded-br-xl text-xs font-bold uppercase tracking-widest" >
        Table(Scoring)
        </div>

{
    Array.from({ length: 5 }).map((_, i) => {
        const isLocked = i >= maxSlots;
        const card = tableCards[i];

        if (isLocked) {
            return (
                <button key= { i } onClick = { buySlot } className = "w-24 h-36 rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/50 flex flex-col items-center justify-center gap-1 hover:bg-slate-800 transition-colors" >
                    <Unlock className="w-5 h-5 text-slate-500" />
                        <div className="text-xs text-slate-400 text-center" > Slot { i + 1 } <br/><span className={chips >= getSlotCost() ? "text-blue-400" : "text-red-400"}>{getSlotCost()}</span > </div>
                            </button>
                        );
}

return (
    <div 
                            key= { i }
onDragOver = { handleDragOver }
onDrop = {(e) => handleDropOnSlot(e, i)}
className = "w-24 h-36 rounded-xl border-2 border-dashed border-slate-500/50 bg-slate-800/20 flex items-center justify-center transition-all hover:bg-white/5 relative"
    >
    {
        card?(
                                <div className = "pointer-events-none" >
                <Card card={ card } />
    </div>
                            ) : (
    <span className= "text-slate-600 text-xs uppercase font-bold" > Drop Card </span>
                            )}
</div>
                    );
                })}
</div>

{/* PLAYER HAND (DRAGGABLE) */ }
<div className="bg-slate-950 p-4 rounded-xl border-t border-slate-800 flex gap-4 items-center h-[180px]" >
    {/* DRAW BUTTON */ }
    < button
onClick = { drawCardToHand }
disabled = { chips<drawCost || handCards.length >= maxHandSize}
className = "w-24 h-36 bg-blue-900 border-4 border-blue-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-blue-800 disabled:opacity-50 disabled:hover:bg-blue-900 shadow-lg shrink-0 active:scale-95 transition-all"
    >
    <Layers className="w-8 h-8 text-blue-200" />
        <div className="text-center leading-none" >
            <div className="text-blue-200 font-bold text-sm" > DRAW </div>
                < div className = "text-blue-400 text-xs mt-1" > { drawCost === 0 ? 'Free' : drawCost}</div>
                    </div>
                    </button>

{/* HAND CARDS */ }
<div className="flex-1 overflow-x-auto flex items-center gap-[-2rem] px-2 pb-2" >
    { handCards.length === 0 && <div className="text-slate-600 text-sm italic ml-4"> Hand empty.Draw cards!</ div >}
{
    handCards.map((card, i) => (
        <div 
                            key= { card.id }
                            draggable
                            onDragStart = {(e) => handleDragStart(e, i)}
className = "hover:-translate-y-4 transition-transform cursor-grab active:cursor-grabbing hover:z-10"
    >
    <Card card={ card } isSmall = { true} />
        </div>
                    ))}
<div className="ml-auto text-xs text-slate-500 self-end whitespace-nowrap" >
    { handCards.length } / { maxHandSize } Cards
        </div>
        </div>
        </div>

        </div>

{/* RIGHT: SHOP */ }
<div className="lg:col-span-4 bg-slate-950 p-4 border-l border-slate-800 flex flex-col gap-4" >
    <div className="flex items-center gap-2 text-yellow-500 border-b border-slate-800 pb-2" >
        <ShoppingBag className="w-5 h-5" />
            <span className="text-lg font-bold" > The Shop </span>
                </div>

                < div className = "flex flex-col gap-3 overflow-y-auto flex-1" >
                {
                    JOKERS_SHOP.map(joker => (
                        <button 
                        key= { joker.id }
                        onClick = {() => buyJoker(joker)}
disabled = { money<joker.cost || jokers.length >= maxJokers }
className = "flex items-center gap-3 bg-slate-900 p-2 rounded-lg border border-slate-800 hover:border-yellow-500/50 hover:bg-slate-800 transition-all disabled:opacity-50 text-left group"
    >
    <div className="w-10 h-14 bg-slate-700 rounded flex items-center justify-center text-yellow-600 font-bold text-[10px]" > JOKER </div>
        < div className = "flex-1 min-w-0" >
            <div className="font-bold text-sm text-slate-200 truncate" > { joker.name } </div>
                < div className = "text-[10px] text-slate-500 leading-tight" > { joker.desc } </div>
                    </div>
                    < div className = "flex flex-col items-end" >
                        <span className={ `font-bold text-sm ${money >= joker.cost ? 'text-yellow-400' : 'text-red-500'}` }> ${ joker.cost } </span>
                            </div>
                            </button>
                 ))}
</div>
    </div>

    </div>
    </div>
  );
}