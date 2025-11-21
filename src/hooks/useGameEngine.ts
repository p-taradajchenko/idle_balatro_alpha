import { useState, useEffect } from 'react';
import type { Card, Joker, Pack } from '../types';
import { evaluateHand, getRandomCard, generateStandardDeck, HAND_TYPES, JOKERS_SHOP } from '../utils/pokerLogic';

export const useGameEngine = () => {
    // -- STATE --
    const [chips, setChips] = useState(0);
    const [money, setMoney] = useState(0);
    const [ante, setAnte] = useState(1);
    const [blindProgress, setBlindProgress] = useState(0);
    const [blindGoal, setBlindGoal] = useState(300);

    const [maxSlots, setMaxSlots] = useState(1);
    const [maxJokers, setMaxJokers] = useState(3);

    // Table Cards (Fixed slots, can be null)
    const [tableCards, setTableCards] = useState<(Card | null)[]>([null, null, null, null, null]);

    // Hand Cards (Array of cards)
    const [handCards, setHandCards] = useState<Card[]>([]);
    const [maxHandSize, setMaxHandSize] = useState(7);

    // Deck System
    const [deck, setDeck] = useState<Card[]>([]);
    const [discardPile, setDiscardPile] = useState<Card[]>([]);

    const [jokers, setJokers] = useState<Joker[]>([]);
    const [drawCost, setDrawCost] = useState(0);

    const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);

    // Calculations for UI
    const [currentHand, setCurrentHand] = useState(HAND_TYPES.NONE);
    const [cps, setCps] = useState(0);
    const [lastHandScore, setLastHandScore] = useState({ chips: 0, mult: 0 });
    const [scoringCards, setScoringCards] = useState<Card[]>([]);

    // -- PERSISTENCE --

    const saveGame = () => {
        const state = {
            chips, money, ante, blindProgress, blindGoal,
            maxSlots, maxJokers, tableCards, handCards, jokers, drawCost,
            maxHandSize, deck, discardPile
        };
        localStorage.setItem('idle_balatro_save', JSON.stringify(state));
    };

    const loadGame = () => {
        const saved = localStorage.getItem('idle_balatro_save');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setChips(parsed.chips);
                setMoney(parsed.money);
                setAnte(parsed.ante);
                setBlindProgress(parsed.blindProgress);
                setBlindGoal(parsed.blindGoal);
                setMaxSlots(parsed.maxSlots);
                setMaxJokers(parsed.maxJokers);
                setTableCards(parsed.tableCards);
                setHandCards(parsed.handCards);
                setJokers(parsed.jokers);
                setDrawCost(parsed.drawCost);
                setMaxHandSize(parsed.maxHandSize || 7);
                setDeck(parsed.deck || generateStandardDeck());
                setDiscardPile(parsed.discardPile || []);
            } catch (e) {
                console.error("Failed to load save", e);
            }
        } else {
            // New Game
            setDeck(generateStandardDeck());
        }
    };

    const resetRun = () => {
        localStorage.removeItem('idle_balatro_save');
        window.location.reload();
    };

    // Load on mount
    useEffect(() => {
        loadGame();
    }, []);

    // Auto-save every 30s
    useEffect(() => {
        const interval = setInterval(() => {
            saveGame();
        }, 30000);
        return () => clearInterval(interval);
    }, [chips, money, ante, blindProgress, blindGoal, maxSlots, maxJokers, tableCards, handCards, jokers, drawCost, deck, discardPile]);

    // -- GAME LOOP --
    useEffect(() => {
        const tickRate = 1000;
        const interval = setInterval(() => {
            const evaluation = evaluateHand(tableCards);
            setCurrentHand(evaluation.type);
            setScoringCards(evaluation.scoringCards);

            let handChips = evaluation.type.chips;
            let handMult = evaluation.type.mult;

            // 1. Card Scoring (Chips)
            evaluation.scoringCards.forEach(card => {
                let cardValue = card.value;
                if (card.enhancement === 'stone') cardValue += 50;

                // Editions (Chips)
                if (card.edition === 'foil') cardValue += 50;

                handChips += cardValue;
            });

            // 2. Card Scoring (Mult) & Effects
            evaluation.scoringCards.forEach(card => {
                // Enhancements
                if (card.enhancement === 'glass') {
                    handMult *= 2;
                    // Break chance handled separately to avoid state update in loop, 
                    // but for idle loop we might need a separate trigger or just accept it happens on tick.
                    // For now, let's NOT break glass in the idle loop to avoid frustration, 
                    // or make it very rare/manual trigger only? 
                    // Let's implement breaking logic in a separate effect or check.
                    if (Math.random() < 0.05) { // 5% chance to break per tick is too high for idle. 
                        // Let's make it 0% for idle loop, only break on manual play if we had one.
                        // Since it's idle, maybe Glass just gives X2 without breaking? 
                        // Or breaks after X seconds? Let's keep it safe for now.
                    }
                }
                if (card.enhancement === 'gold') {
                    setMoney(prev => prev + 3);
                }

                // Editions (Mult)
                if (card.edition === 'holographic') handMult += 10;
                if (card.edition === 'polychrome') handMult *= 1.5;
            });

            // 3. Held Card Effects (Steel)
            handCards.forEach(card => {
                if (card.enhancement === 'steel') {
                    handMult *= 1.5;
                }
            });

            // 4. Joker Scoring
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
                    handleBlindDefeated();
                    return 0;
                }
                return newVal;
            });

            setChips(prev => prev + Math.floor(score * 0.5));

        }, tickRate);

        return () => clearInterval(interval);
    }, [tableCards, jokers, blindGoal, handCards]); // Added handCards dependency for Steel cards

    const handleBlindDefeated = () => {
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

        // Save on blind completion
        setTimeout(saveGame, 0);
    };

    // -- ACTIONS --



    const drawCardToHand = () => {
        if (chips < drawCost || handCards.length >= maxHandSize) return;

        // Auto-reshuffle if deck is empty
        if (deck.length === 0) {
            if (discardPile.length > 0) {
                // Let's handle the reshuffle logic inline for immediate draw
                const newDeck = [...discardPile];
                for (let i = newDeck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
                }

                const card = newDeck.pop();
                if (card) {
                    setChips(prev => prev - drawCost);
                    setDrawCost(prev => prev === 0 ? 5 : Math.floor(prev * 1.5));
                    setHandCards(prev => [...prev, card]);
                    setDeck(newDeck);
                    setDiscardPile([]);
                }
                return;
            } else {
                // No cards left anywhere!
                return;
            }
        }

        setChips(prev => prev - drawCost);
        setDrawCost(prev => prev === 0 ? 5 : Math.floor(prev * 1.5));

        const newDeck = [...deck];
        const card = newDeck.pop(); // Take from top (end of array)

        if (card) {
            setHandCards(prev => [...prev, card]);
            setDeck(newDeck);
        }
    };

    const discardCard = (index: number) => {
        const card = handCards[index];
        setHandCards(prev => prev.filter((_, i) => i !== index));
        setDiscardPile(prev => [...prev, card]);
    };

    const buySlot = () => {
        const cost = 100 * Math.pow(10, maxSlots - 1);
        if (chips >= cost && maxSlots < 5) {
            setChips(prev => prev - cost);
            setMaxSlots(prev => prev + 1);
        }
    };

    const buyJoker = (jokerTemplate: Joker) => {
        if (money >= jokerTemplate.cost && jokers.length < maxJokers) {
            setMoney(prev => prev - jokerTemplate.cost);
            setJokers(prev => [...prev, { ...jokerTemplate, uid: Math.random().toString() }]);
        }
    };

    const buyPack = (pack: Pack) => {
        if (money >= pack.cost) {
            setMoney(prev => prev - pack.cost);

            if (pack.type === 'standard') {
                // Add 1 Enhanced Card to Hand if possible, else Discard Pile (effectively adding to deck)
                const newCard = getRandomCard(true); // Enhanced = true

                if (handCards.length < maxHandSize) {
                    setHandCards(prev => [...prev, newCard]);
                } else {
                    setDiscardPile(prev => [...prev, newCard]);
                }
            } else if (pack.type === 'buffoon') {
                // Add 1 Random Joker
                if (jokers.length < maxJokers) {
                    const randomJoker = JOKERS_SHOP[Math.floor(Math.random() * JOKERS_SHOP.length)];
                    setJokers(prev => [...prev, { ...randomJoker, uid: Math.random().toString() }]);
                }
            }
        }
    };

    const sellJoker = (index: number) => {
        const joker = jokers[index];
        setMoney(prev => prev + Math.floor(joker.cost / 2));
        setJokers(prev => prev.filter((_, i) => i !== index));
    };

    // -- DRAG AND DROP LOGIC --

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedCardIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDropOnSlot = (e: React.DragEvent, slotIndex: number) => {
        e.preventDefault();
        if (draggedCardIndex === null) return;
        if (slotIndex >= maxSlots) return; // Locked slot

        const cardToPlay = handCards[draggedCardIndex];

        // If there was a card there, move it to discard pile? Or swap?
        // Balatro logic: Played cards are scored then discarded.
        // Idle logic: Cards stay on table to generate CpS.
        // If we replace a card, the old one should go to discard pile (or back to hand?).
        // Let's send old card to discard pile to keep flow moving.

        setTableCards(prev => {
            const newTable = [...prev];
            const oldCard = newTable[slotIndex];
            if (oldCard) {
                setDiscardPile(p => [...p, oldCard]);
            }
            newTable[slotIndex] = cardToPlay;
            return newTable;
        });

        setHandCards(prev => prev.filter((_, i) => i !== draggedCardIndex));
        setDraggedCardIndex(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const getSlotCost = () => 100 * Math.pow(10, maxSlots - 1);

    return {
        chips, money, ante, blindProgress, blindGoal,
        maxSlots, maxJokers, tableCards, handCards, jokers, drawCost,
        currentHand, cps, lastHandScore, maxHandSize, scoringCards,
        deck, discardPile,
        drawCardToHand, discardCard, buySlot, buyJoker, buyPack, sellJoker,
        handleDragStart, handleDropOnSlot, handleDragOver, getSlotCost,
        resetRun
    };
};
