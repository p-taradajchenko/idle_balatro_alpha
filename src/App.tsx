import { ShoppingBag, Unlock, RotateCcw, Trash2 } from 'lucide-react';
import { useGameEngine } from './hooks/useGameEngine';
import { PlayingCard } from './components/PlayingCard';
import { JOKERS_SHOP, PACKS } from './utils/pokerLogic';

export default function App() {
  const {
    chips, money, ante, blindProgress, blindGoal,
    maxSlots, maxJokers, tableCards, handCards, jokers, drawCost,
    currentHand, cps, scoringCards,
    deck, discardPile, maxHandSize,
    drawCardToHand, discardCard, buySlot, buyJoker, buyPack, sellJoker,
    handleDragStart, handleDropOnSlot, handleDragOver, getSlotCost,
    resetRun
  } = useGameEngine();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-yellow-500/30">

      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6 fixed w-full top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg shadow-lg rotate-3"></div>
          <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            IDLE BALATRO
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Blind</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{blindProgress.toLocaleString()}</span>
              <span className="text-sm font-bold text-slate-500">/ {blindGoal.toLocaleString()}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800"></div>

          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Money</span>
            <div className="flex items-center gap-1 text-yellow-400">
              <span className="text-lg font-bold">$</span>
              <span className="text-2xl font-black">{money}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800"></div>

          <button
            onClick={resetRun}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
            title="Reset Run"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      <main className="pt-20 pb-6 px-6 h-screen flex gap-6">

        {/* Left Column - Game Area */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">

          {/* Stats Bar */}
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">Chips</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-black text-blue-400">{chips.toLocaleString()}</div>
                <div className="text-sm font-bold text-blue-400/50 animate-float-up" key={chips}>+{cps}/s</div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">Ante</div>
              <div className="text-2xl font-black text-orange-400">{ante}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">Hand</div>
              <div className="text-lg font-bold text-white truncate">{currentHand.name}</div>
              <div className="text-xs font-mono text-slate-400">
                {currentHand.chips} x {currentHand.mult}
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div
            className="flex-1 bg-slate-900/50 rounded-2xl border-4 border-slate-800 relative overflow-hidden felt-table"
            onDragOver={handleDragOver}
          >
            {/* Slots */}
            <div className="absolute inset-0 flex items-center justify-center gap-4 p-8">
              {Array.from({ length: 5 }).map((_, i) => {
                const isLocked = i >= maxSlots;
                const card = tableCards[i];

                return (
                  <div
                    key={i}
                    onDrop={(e) => handleDropOnSlot(e, i)}
                    onDragOver={handleDragOver}
                    className={`
                        w-24 h-36 rounded-xl border-2 border-dashed flex items-center justify-center transition-all
                        ${isLocked
                        ? 'border-slate-800 bg-slate-900/50'
                        : 'border-slate-600/50 bg-slate-800/20 hover:bg-slate-800/40 hover:border-slate-500'
                      }
                      `}
                  >
                    {isLocked ? (
                      <button key={i} onClick={buySlot} className="w-24 h-36 rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/50 flex flex-col items-center justify-center gap-1 hover:bg-slate-800 transition-colors">
                        <Unlock className="w-5 h-5 text-slate-500" />
                        <div className="text-xs text-slate-400 text-center">Slot {i + 1}<br /><span className={chips >= getSlotCost() ? "text-blue-400" : "text-red-400"}>{getSlotCost()}</span></div>
                      </button>
                    ) : card ? (
                      <PlayingCard card={card} isScoring={scoringCards.some(sc => sc.id === card.id)} />
                    ) : (
                      <div className="text-slate-700 font-bold text-xs uppercase">Slot {i + 1}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hand Area */}
          <div className="h-48 bg-slate-900 border-t border-slate-800 -mx-6 px-6 flex items-center gap-4 overflow-x-auto">

            {/* Deck & Discard Info */}
            <div className="flex flex-col gap-2 shrink-0 mr-2">
              <div className="w-16 h-20 bg-slate-800 rounded border border-slate-700 flex flex-col items-center justify-center relative group cursor-help">
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {deck.length}
                </div>
                <div className="w-10 h-14 bg-red-900/50 rounded border border-red-800/50"></div>
                <span className="text-[10px] text-slate-500 uppercase font-bold mt-1">Deck</span>
              </div>
              <div className="w-16 h-20 bg-slate-800 rounded border border-slate-700 flex flex-col items-center justify-center relative group cursor-help">
                <div className="absolute -top-2 -right-2 bg-slate-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {discardPile.length}
                </div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Discard</span>
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 min-w-max">
              {handCards.map((card, i) => (
                <div key={card.id} className="relative group">
                  <PlayingCard
                    card={card}
                    isDraggable={true}
                    onDragStart={(e) => handleDragStart(e, i)}
                  />
                  <button
                    onClick={() => discardCard(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10"
                    title="Discard"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={drawCardToHand}
              disabled={chips < drawCost || handCards.length >= maxHandSize || (deck.length === 0 && discardPile.length === 0)}
              className="h-36 w-24 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 hover:bg-slate-800 hover:border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-auto shrink-0 mr-4"
            >
              <span className="text-xs font-bold text-slate-500 uppercase">Draw</span>
              <span className="text-xl font-black text-blue-400">${drawCost}</span>
              {deck.length === 0 && discardPile.length > 0 && (
                <span className="text-[10px] text-orange-400 animate-pulse">Reshuffle</span>
              )}
            </button>
          </div>

        </div>

        {/* Right Column - Shop */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 -my-6 -mr-6 p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="flex items-center gap-2 text-yellow-500 pb-4 border-b border-slate-800">
            <ShoppingBag className="w-5 h-5" />
            <span className="text-lg font-bold">The Shop</span>
          </div>

          {/* Booster Packs */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Booster Packs</h3>
            <div className="grid grid-cols-1 gap-3">
              {PACKS.map(pack => (
                <button
                  key={pack.id}
                  onClick={() => buyPack(pack)}
                  disabled={money < pack.cost}
                  className="flex flex-col items-start p-3 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed group transition-colors text-left w-full"
                >
                  <div className="flex justify-between w-full mb-1">
                    <span className="font-bold text-white group-hover:text-yellow-400 transition-colors">{pack.name}</span>
                    <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded text-sm font-mono">${pack.cost}</span>
                  </div>
                  <div className="text-xs text-slate-400">{pack.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Jokers */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Jokers ({jokers.length}/{maxJokers})</h3>
            <div className="grid grid-cols-1 gap-3">
              {JOKERS_SHOP.map(joker => (
                <button
                  key={joker.id}
                  onClick={() => buyJoker(joker)}
                  disabled={money < joker.cost || jokers.length >= maxJokers}
                  className="flex flex-col items-start p-3 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed group transition-colors text-left w-full"
                >
                  <div className="flex justify-between w-full mb-1">
                    <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{joker.name}</span>
                    <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded text-sm font-mono">${joker.cost}</span>
                  </div>
                  <div className="text-xs text-slate-400">{joker.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Jokers List (Visual Only for now) */}
          {jokers.length > 0 && (
            <div className="mt-auto pt-6 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Your Jokers</h3>
              <div className="flex flex-col gap-2">
                {jokers.map((joker, i) => (
                  <div key={joker.uid} className="flex items-center justify-between bg-slate-800/50 p-2 rounded border border-slate-700">
                    <span className="text-sm font-bold text-slate-300">{joker.name}</span>
                    <button
                      onClick={() => sellJoker(i)}
                      className="text-xs text-red-400 hover:text-red-300 hover:underline"
                    >
                      Sell (${Math.floor(joker.cost / 2)})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
