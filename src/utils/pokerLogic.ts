import { Heart, Diamond, Club, Spade } from 'lucide-react';
import type { Card, HandResult, Joker, Pack } from '../types';
import React from 'react';

// --- CONSTANTS ---

export const SUITS = [
    { type: 'hearts', icon: React.createElement(Heart, { className: "w-4 h-4 fill-red-500 text-red-500" }), color: 'red' },
    { type: 'diamonds', icon: React.createElement(Diamond, { className: "w-4 h-4 fill-red-500 text-red-500" }), color: 'red' },
    { type: 'clubs', icon: React.createElement(Club, { className: "w-4 h-4 fill-slate-800 text-slate-800" }), color: 'black' },
    { type: 'spades', icon: React.createElement(Spade, { className: "w-4 h-4 fill-slate-800 text-slate-800" }), color: 'black' },
] as const;

export const RANKS = [
    { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 },
    { label: '5', value: 5 }, { label: '6', value: 6 }, { label: '7', value: 7 },
    { label: '8', value: 8 }, { label: '9', value: 9 }, { label: '10', value: 10 },
    { label: 'J', value: 10 }, { label: 'Q', value: 10 }, { label: 'K', value: 10 },
    { label: 'A', value: 11 },
] as const;

export const HAND_TYPES = {
    NONE: { name: 'None', chips: 0, mult: 0 },
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

export const JOKERS_SHOP: Joker[] = [
    { id: 'j_joker', name: 'Joker', desc: '+4 Mult', cost: 2, rarity: 'Common', type: 'mult', val: 4 },
    { id: 'j_greedy', name: 'Greedy Joker', desc: 'Played cards with Diamond suit give +4 Mult', cost: 5, rarity: 'Common', type: 'suit_mult', suit: 'diamonds', val: 4 },
    { id: 'j_lusty', name: 'Lusty Joker', desc: 'Played cards with Heart suit give +4 Mult', cost: 5, rarity: 'Common', type: 'suit_mult', suit: 'hearts', val: 4 },
    { id: 'j_wrathful', name: 'Wrathful Joker', desc: 'Played cards with Spade suit give +4 Mult', cost: 5, rarity: 'Common', type: 'suit_mult', suit: 'spades', val: 4 },
    { id: 'j_gluttenous', name: 'Gluttonous Joker', desc: 'Played cards with Club suit give +4 Mult', cost: 5, rarity: 'Common', type: 'suit_mult', suit: 'clubs', val: 4 },
    { id: 'j_sly', name: 'Sly Joker', desc: '+50 Chips if Pair', cost: 4, rarity: 'Common', type: 'hand_chip', hand: 'PAIR', val: 50 },
    { id: 'j_banner', name: 'Banner', desc: '+40 Chips for each remaining discard (mock)', cost: 6, rarity: 'Common', type: 'flat_chip', val: 40 },
    { id: 'j_cavendish', name: 'Gros Michel', desc: '+15 Mult, 1 in 6 chance to die per blind', cost: 5, rarity: 'Uncommon', type: 'mult', val: 15, perishable: true },

    // Hand Mult
    { id: 'j_jolly', name: 'Jolly Joker', desc: '+8 Mult if Pair', cost: 4, rarity: 'Common', type: 'hand_mult', hand: 'PAIR', val: 8 },
    { id: 'j_zany', name: 'Zany Joker', desc: '+12 Mult if Three of a Kind', cost: 4, rarity: 'Common', type: 'hand_mult', hand: 'THREE OF A KIND', val: 12 },
    { id: 'j_mad', name: 'Mad Joker', desc: '+20 Mult if Two Pair', cost: 4, rarity: 'Common', type: 'hand_mult', hand: 'TWO PAIR', val: 20 },
    { id: 'j_crazy', name: 'Crazy Joker', desc: '+12 Mult if Straight', cost: 4, rarity: 'Common', type: 'hand_mult', hand: 'STRAIGHT', val: 12 },
    { id: 'j_droll', name: 'Droll Joker', desc: '+10 Mult if Flush', cost: 4, rarity: 'Common', type: 'hand_mult', hand: 'FLUSH', val: 10 },

    // Hand Chips
    { id: 'j_wily', name: 'Wily Joker', desc: '+100 Chips if Three of a Kind', cost: 4, rarity: 'Common', type: 'hand_chip', hand: 'THREE OF A KIND', val: 100 },
    { id: 'j_clever', name: 'Clever Joker', desc: '+80 Chips if Two Pair', cost: 4, rarity: 'Common', type: 'hand_chip', hand: 'TWO PAIR', val: 80 },
    { id: 'j_devious', name: 'Devious Joker', desc: '+100 Chips if Straight', cost: 4, rarity: 'Common', type: 'hand_chip', hand: 'STRAIGHT', val: 100 },
    { id: 'j_crafty', name: 'Crafty Joker', desc: '+80 Chips if Flush', cost: 4, rarity: 'Common', type: 'hand_chip', hand: 'FLUSH', val: 80 },

    // Uncommon / Scaling / Utility
    { id: 'j_popcorn', name: 'Popcorn', desc: '+20 Mult, -4 Mult per round played', cost: 5, rarity: 'Uncommon', type: 'scaling', val: 20, data: { decay: 4 } },
    { id: 'j_ice_cream', name: 'Ice Cream', desc: '+100 Chips, -5 Chips per hand played', cost: 5, rarity: 'Uncommon', type: 'scaling', val: 100, data: { decay: 5 } },
    { id: 'j_misprint', name: 'Misprint', desc: 'Random Mult between 0 and 23', cost: 4, rarity: 'Uncommon', type: 'utility' },
    { id: 'j_raised_fist', name: 'Raised Fist', desc: 'Adds double the rank of lowest card held in hand to Mult', cost: 5, rarity: 'Uncommon', type: 'utility' },
    { id: 'j_fibonacci', name: 'Fibonacci', desc: 'Each played Ace, 2, 3, 5, or 8 gives +8 Mult', cost: 5, rarity: 'Uncommon', type: 'suit_mult', val: 8, data: { ranks: [14, 2, 3, 5, 8] } }, // Reusing suit_mult type for card-specific mult for now, or custom logic

    // Rare
    { id: 'j_cavendish_rare', name: 'Cavendish', desc: 'X3 Mult, 1 in 1000 chance to die', cost: 8, rarity: 'Rare', type: 'utility', val: 3, perishable: true },
    { id: 'j_card_sharp', name: 'Card Sharp', desc: 'X3 Mult if played hand has already been played this round', cost: 8, rarity: 'Rare', type: 'utility', val: 3 },
    { id: 'j_blackboard', name: 'Blackboard', desc: 'X3 Mult if all cards held in hand are Spades or Clubs', cost: 8, rarity: 'Rare', type: 'utility', val: 3 },

    // Economy
    { id: 'j_golden', name: 'Golden Joker', desc: 'Earn $4 at end of round', cost: 6, rarity: 'Common', type: 'economy', val: 4 },
    { id: 'j_egg', name: 'Egg', desc: 'Gains $3 of sell value at end of round', cost: 4, rarity: 'Common', type: 'economy', val: 3 },
    { id: 'j_credit_card', name: 'Credit Card', desc: 'Go up to -$20 in debt', cost: 1, rarity: 'Common', type: 'economy', val: 20 },
];

export const PACKS: Pack[] = [
    { id: 'p_standard', name: 'Standard Pack', cost: 4, desc: 'Choose 1 of up to 3 Playing cards', type: 'standard' },
    { id: 'p_standard_jumbo', name: 'Jumbo Standard Pack', cost: 6, desc: 'Choose 1 of up to 5 Playing cards', type: 'standard' },
    { id: 'p_standard_mega', name: 'Mega Standard Pack', cost: 8, desc: 'Choose 2 of up to 5 Playing cards', type: 'standard' },
    { id: 'p_buffoon', name: 'Buffoon Pack', cost: 6, desc: 'Choose 1 of up to 2 Joker cards', type: 'buffoon' },
    { id: 'p_buffoon_jumbo', name: 'Jumbo Buffoon Pack', cost: 10, desc: 'Choose 1 of 4 Jokers', type: 'buffoon' },
    { id: 'p_buffoon_mega', name: 'Mega Buffoon Pack', cost: 15, desc: 'Choose 2 of 4 Jokers', type: 'buffoon' },
];

// --- UTILS ---

export const getRandomCard = (enhanced = false): Card => {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];

    let enhancement: Card['enhancement'] = 'none';
    let edition: Card['edition'] = 'none';

    if (enhanced) {
        const roll = Math.random();
        if (roll < 0.3) enhancement = 'gold';
        else if (roll < 0.6) enhancement = 'steel';
        else if (roll < 0.8) enhancement = 'glass';
        else enhancement = 'stone';

        const edRoll = Math.random();
        if (edRoll < 0.1) edition = 'polychrome';
        else if (edRoll < 0.2) edition = 'holographic';
        else if (edRoll < 0.3) edition = 'foil';
    }

    return {
        id: Math.random().toString(36).substr(2, 9),
        suit: suit.type as any,
        rankLabel: rank.label,
        value: rank.value,
        color: suit.color,
        enhancement,
        edition
    };
};

export const generateStandardDeck = (): Card[] => {
    const deck: Card[] = [];
    SUITS.forEach(suit => {
        RANKS.forEach(rank => {
            deck.push({
                id: Math.random().toString(36).substr(2, 9),
                suit: suit.type as any,
                rankLabel: rank.label,
                value: rank.value,
                color: suit.color,
                enhancement: 'none',
                edition: 'none'
            });
        });
    });

    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
};

// Helper to evaluate poker hand
export const evaluateHand = (cards: (Card | null)[]): HandResult => {
    const validCards = cards.filter((c): c is Card => c !== null && c !== undefined);
    if (validCards.length === 0) return { type: HAND_TYPES.NONE, scoringCards: [] };

    const rankOrder: Record<string, number> = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

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

    const counts: Record<number, number> = {};
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
