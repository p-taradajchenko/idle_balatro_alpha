Idle Balatro - Technical Design Document1. Project OverviewTitle: Idle Balatro (Working Title)Genre: Idle / Incremental / DeckbuilderCore Loop: 1. Generate: Cards on a "Table" form poker hands to generate Chips/sec (CpS).2. Optimize: User drags cards from a "Hand" to the "Table" to improve poker hands.3. Monetize: Filling a "Blind" bar converts Chips into Money ($).4. Upgrade: Money buys Jokers (passive modifiers) and Booster Packs.2. Architecture & Tech StackFramework: React 18+Language: TypeScript (Recommended for port) or JavaScript (ES6+)Styling: Tailwind CSSIcons: Lucide-ReactState Management: React Context API or Zustand (to avoid prop drilling in a multi-component structure).Persistence: localStorage (MVP) -> Firestore (Future).3. Data Structures3.1. Card Entityinterface Card {
  id: string;          // Unique UUID
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rankLabel: string;   // '2'...'10', 'J', 'Q', 'K', 'A'
  value: number;       // Base chip value (2-11)
  enhancement?: 'glass' | 'gold' | 'steel' | 'stone'; // Future feature
  edition?: 'foil' | 'holographic' | 'polychrome';    // Future feature
}
3.2. Joker Entityinterface Joker {
  id: string;
  uid: string;         // Instance ID
  name: string;
  description: string;
  cost: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  
  // Logic Triggers
  type: 'mult' | 'flat_chip' | 'suit_mult' | 'hand_chip';
  value: number;
  targetCondition?: string; // e.g., 'diamonds', 'PAIR'
  perishable?: boolean;     // If true, has chance to delete self
}
3.3. Game Stateinterface GameState {
  // Currency
  chips: number;
  money: number;
  
  // Progression
  ante: number;
  blindProgress: number;
  blindGoal: number;
  
  // Inventory
  tableCards: (Card | null)[]; // Fixed size (maxSlots)
  handCards: Card[];           // Dynamic size (up to maxHandSize)
  jokers: Joker[];             // Dynamic size (up to maxJokers)
  
  // Caps
  maxSlots: number;
  maxHandSize: number;
  maxJokers: number;
  
  // Economy
  drawCost: number;
}
4. Component Hierarchy (Refactoring Target)The current OneFile.jsx should be split into:GameEngine.tsx (Context Provider & Tick Loop)Layout.tsx (Main Grid)Header.tsx (Stats, Blind Progress)TableArea.tsx (The active scoring zone)Slot.tsxPlayerHand.tsx (Draggable card area)PlayingCard.tsx (Visual component)Shop.tsx (Right sidebar)JokerCard.tsx5. Mechanics & Formulas5.1. Scoring Formula$$Score/sec = (\sum CardChips + BaseHandChips + JokerFlatChips) \times (BaseHandMult + JokerMult)$$5.2. Blind Scaling$$Goal_{n} = Goal_{n-1} \times 1.8$$ (Exponential difficulty curve)