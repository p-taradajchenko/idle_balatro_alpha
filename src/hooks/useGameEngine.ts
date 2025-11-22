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
    const [deck, setDeck] = useState<Card[]>(generateStandardDeck());
    const [discardPile, setDiscardPile] = useState<Card[]>([]);

    const [jokers, setJokers] = useState<Joker[]>([]);
    const [drawCost, setDrawCost] = useState(0);

    const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);

    // Calculations for UI
    const [currentHand, setCurrentHand] = useState(HAND_TYPES.NONE);
    const [cps, setCps] = useState(0);
    const [lastHandScore, setLastHandScore] = useState({ chips: 0, mult: 0 });
    const [scoringCards, setScoringCards] = useState<Card[]>([]);

    // Pack Opening State
    const [packOpening, setPackOpening] = useState<{
        isOpen: boolean;
        type: Pack['type'];
        options: (Card | Joker)[];
        choicesRemaining: number;
    } | null>(null);

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
                const val = joker.val || 0;

                // Standard Types
                if (joker.type === 'mult') handMult += val;
                if (joker.type === 'flat_chip') handChips += val;
                if (joker.type === 'hand_chip' && evaluation.type.name.toUpperCase() === joker.hand) handChips += val;
                if (joker.type === 'hand_mult' && evaluation.type.name.toUpperCase() === joker.hand) handMult += val;

                // Suit Mult (and Fibonacci)
                if (joker.type === 'suit_mult') {
                    if (joker.id === 'j_fibonacci') {
                        // Fibonacci: Aces, 2, 3, 5, 8
                        const fibRanks = [14, 2, 3, 5, 8];
                        evaluation.scoringCards.forEach(c => {
                            if (fibRanks.includes(c.value === 11 ? 14 : c.value)) { // Handle Ace value mapping if needed
                                handMult += val;
                            }
                        });
                    } else if (evaluation.scoringCards.some(c => c.suit === joker.suit)) {
                        handMult += val;
                    }
                }

                // Scaling (Current value)
                if (joker.type === 'scaling') {
                    if (joker.id === 'j_popcorn') handMult += val;
                    if (joker.id === 'j_ice_cream') handChips += val;
                }

                // Utility
                if (joker.type === 'utility') {
                    if (joker.id === 'j_misprint') {
                        handMult += Math.floor(Math.random() * 24);
                    }
                    if (joker.id === 'j_raised_fist') {
                        if (handCards.length > 0) {
                            // Find lowest rank card in hand
                            const lowest = handCards.reduce((min, c) => c.value < min.value ? c : min, handCards[0]);
                            handMult += (lowest.value * 2);
                        }
                    }
                    if (joker.id === 'j_blackboard') {
                        const allBlack = handCards.length > 0 && handCards.every(c => c.suit === 'spades' || c.suit === 'clubs');
                        if (allBlack) handMult *= 3;
                    }
                    if (joker.id === 'j_cavendish_rare') {
                        handMult *= 3;
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

        // Joker Effects (Economy & Scaling)
        setJokers(prev => {
            return prev.map(j => {
                // Economy
                if (j.id === 'j_golden') {
                    setMoney(m => m + 4);
                }
                if (j.id === 'j_egg') {
                    return { ...j, cost: j.cost + 3 };
                }

                // Scaling Decay
                if (j.id === 'j_popcorn') {
                    const newVal = (j.val || 0) - 4;
                    if (newVal <= 0) return null; // Destroyed? Popcorn just loses mult. Does it die? Balatro wiki: "Commonly destroyed when it reaches 0".
                    return { ...j, val: newVal };
                }
                if (j.id === 'j_ice_cream') {
                    const newVal = (j.val || 0) - 5;
                    if (newVal <= 0) return null;
                    return { ...j, val: newVal };
                }

                return j;
            }).filter((j): j is Joker => j !== null)
                .filter(j => {
                    // Perishable
                    if (j.perishable) {
                        if (j.id === 'j_cavendish') {
                            if (Math.random() < (1 / 6)) return false; // 1 in 6
                        }
                        if (j.id === 'j_cavendish_rare') {
                            if (Math.random() < (1 / 1000)) return false; // 1 in 1000
                        }
                    }
                    return true;
                });
        });

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

    const getSpendingLimit = () => {
        const hasCreditCard = jokers.some(j => j.id === 'j_credit_card');
        return hasCreditCard ? -20 : 0;
    };

    const buySlot = () => {
        const cost = 100 * Math.pow(10, maxSlots - 1);
        if (chips >= cost && maxSlots < 5) {
            setChips(prev => prev - cost);
            setMaxSlots(prev => prev + 1);
        }
    };

    const buyJoker = (jokerTemplate: Joker) => {
        const limit = getSpendingLimit();
        if (money - jokerTemplate.cost >= limit && jokers.length < maxJokers) {
            setMoney(prev => prev - jokerTemplate.cost);
            setJokers(prev => [...prev, { ...jokerTemplate, uid: Math.random().toString() }]);
        }
    };

    const buyPack = (pack: Pack) => {
        const limit = getSpendingLimit();
        if (money - pack.cost >= limit) {
            setMoney(prev => prev - pack.cost);

            if (pack.type === 'standard') {
                let count = 3;
                let choices = 1;

                if (pack.id === 'p_standard_jumbo') { count = 5; choices = 1; }
                if (pack.id === 'p_standard_mega') { count = 5; choices = 2; }

                // Generate random cards
                const options: Card[] = [];
                for (let i = 0; i < count; i++) {
                    options.push(getRandomCard(true));
                }

                setPackOpening({
                    isOpen: true,
                    type: 'standard',
                    options,
                    choicesRemaining: choices
                });
            } else if (pack.type === 'buffoon') {
                let count = 2;
                let choices = 1;

                if (pack.id === 'p_buffoon_jumbo') { count = 4; choices = 1; }
                if (pack.id === 'p_buffoon_mega') { count = 4; choices = 2; }

                // Generate random Jokers
                const options: Joker[] = [];
                for (let i = 0; i < count; i++) {
                    options.push({
                        ...JOKERS_SHOP[Math.floor(Math.random() * JOKERS_SHOP.length)],
                        uid: Math.random().toString()
                    });
                }

                setPackOpening({
                    isOpen: true,
                    type: 'buffoon',
                    options,
                    choicesRemaining: choices
                });
            }
        }
    };

    const selectPackOption = (index: number) => {
        if (!packOpening) return;

        const selected = packOpening.options[index];

        if (packOpening.type === 'standard') {
            const card = selected as Card;
            if (handCards.length < maxHandSize) {
                setHandCards(prev => [...prev, card]);
            } else {
                setDiscardPile(prev => [...prev, card]);
            }
        } else if (packOpening.type === 'buffoon') {
            const joker = selected as Joker;
            if (jokers.length < maxJokers) {
                setJokers(prev => [...prev, joker]);
            }
        }

        setPackOpening(prev => {
            if (!prev) return null;
            const newChoices = prev.choicesRemaining - 1;
            if (newChoices <= 0) {
                return null; // Close modal
            }
            // Remove selected option from list to prevent duplicate picks if multiple choices allowed
            return { ...prev, choicesRemaining: newChoices, options: prev.options.filter((_, i) => i !== index) };
        });
    };

    const skipPack = () => {
        setPackOpening(null);
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
        packOpening, selectPackOption, skipPack,
        handleDragStart, handleDropOnSlot, handleDragOver, getSlotCost,
        resetRun
    };
};
