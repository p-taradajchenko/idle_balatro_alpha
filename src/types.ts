

export interface Card {
    id: string;
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    rankLabel: string;
    value: number;
    color?: string;
    enhancement?: 'glass' | 'gold' | 'steel' | 'stone' | 'none';
    edition?: 'foil' | 'holographic' | 'polychrome' | 'none';
}

export interface Joker {
    id: string;
    uid?: string;
    name: string;
    desc: string;
    cost: number;
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
    type: 'mult' | 'flat_chip' | 'suit_mult' | 'hand_chip' | 'hand_mult' | 'scaling' | 'economy' | 'utility';
    val?: number;
    suit?: string;
    hand?: string;
    perishable?: boolean;
    data?: Record<string, any>; // For dynamic state (e.g. current scaling value)
}

export interface Pack {
    id: string;
    name: string;
    cost: number;
    desc: string;
    type: 'standard' | 'buffoon';
}

export interface HandResult {
    type: {
        name: string;
        chips: number;
        mult: number;
    };
    scoringCards: Card[];
}
