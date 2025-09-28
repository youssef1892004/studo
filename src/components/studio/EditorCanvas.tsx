// src/components/studio/EditorCanvas.tsx
'use client';

import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Type, Edit3, MoreHorizontal, Sun } from "lucide-react";
import { TTSCardData, Voice } from "@/lib/types";
import SortableEditorBlock from "../SortableEditorBlock";

interface EditorCanvasProps {
    cards: TTSCardData[];
    setCards: (cards: TTSCardData[] | ((prev: TTSCardData[]) => TTSCardData[])) => void;
    voices: Voice[];
    activeCardId: string | null;
    setActiveCardId: (id: string | null) => void;
    updateCard: (id: string, data: Partial<TTSCardData>) => void;
    removeCard: (id: string) => void;
    addCard: () => void;
    error: string | null;
    pageMessage: string | null;
}

export default function EditorCanvas({ 
    cards, setCards, voices, activeCardId, setActiveCardId, 
    updateCard, removeCard, addCard, error, pageMessage
}: EditorCanvasProps) {

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function handleDragEnd({ active, over }: DragEndEvent) {
        if (over && active.id !== over.id) {
            const oldIndex = cards.findIndex(item => item.id === active.id);
            const newIndex = cards.findIndex(item => item.id === over.id);
            setCards(arrayMove(cards, oldIndex, newIndex));
        }
    }

    return (
        <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                <span className="text-sm font-semibold text-gray-700">Speech Synthesis</span>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-200 rounded-lg"><Type className="w-4 h-4 text-gray-600" /></button>
                    <button className="p-2 hover:bg-gray-200 rounded-lg"><Edit3 className="w-4 h-4 text-gray-600" /></button>
                    <button className="p-2 hover:bg-gray-200 rounded-lg"><MoreHorizontal className="w-4 h-4 text-gray-600" /></button>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                {(error || pageMessage) && (
                    <div className={`max-w-4xl mx-auto w-full mb-4 p-3 rounded-lg text-center text-sm font-medium ${error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {error || pageMessage}
                    </div>
                )}
                
                <div className="w-full max-w-4xl mx-auto">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                            {cards.map((card) => (
                                <SortableEditorBlock 
                                    key={card.id} 
                                    cardData={card} 
                                    voices={voices} 
                                    onUpdate={updateCard} 
                                    onRemove={removeCard} 
                                    isActive={activeCardId === card.id} 
                                    onClick={setActiveCardId} 
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                    <div className="flex justify-center mt-4 p-4">
                        <button onClick={addCard} className="p-3 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100 transition-colors">
                            <Plus size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}