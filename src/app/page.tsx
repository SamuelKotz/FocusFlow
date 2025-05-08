'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TaskList from '@/components/TaskList';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { ListData, CardData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, LayoutGrid } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

const initialLists: ListData[] = [
  { id: 'list-1', title: 'To Do', cards: [{ id: 'card-1-1', content: 'Example Task 1', order:0 }, { id: 'card-1-2', content: 'Example Task 2', order:1 }] },
  { id: 'list-2', title: 'In Progress', cards: [] },
  { id: 'list-3', title: 'Done', cards: [] },
];

export default function Home() {
  const [lists, setLists] = useLocalStorage<ListData[]>('organizeNowLists', initialLists);
  const [newListTitle, setNewListTitle] = useState('');
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  const addList = () => {
    if (newListTitle.trim() === '') {
      toast({ title: "Error", description: "List title cannot be empty.", variant: "destructive" });
      return;
    }
    const newList: ListData = {
      id: `list-${Date.now()}`,
      title: newListTitle,
      cards: [],
    };
    setLists([...lists, newList]);
    setNewListTitle('');
    toast({ title: "List Added", description: `List "${newList.title}" has been created.`});
  };
  
  const deleteList = (listId: string) => {
    const listToDelete = lists.find(l => l.id === listId);
    setLists(lists.filter(list => list.id !== listId));
    if (listToDelete) {
        toast({ title: "List Deleted", description: `List "${listToDelete.title}" has been removed.`, variant: "destructive" });
    }
  };

  const updateListTitle = (listId: string, newTitle: string) => {
    setLists(lists.map(list => list.id === listId ? { ...list, title: newTitle } : list));
    toast({ title: "List Updated", description: `List title changed to "${newTitle}".`});
  };

  const addCardToList = (listId: string, cardContent: string) => {
    const newCard: CardData = {
      id: `card-${listId}-${Date.now()}`,
      content: cardContent,
      order: lists.find(l => l.id === listId)?.cards.length || 0,
    };
    setLists(
      lists.map(list =>
        list.id === listId ? { ...list, cards: [...list.cards, newCard] } : list
      )
    );
    toast({ title: "Card Added", description: "New card created."});
  };

  const deleteCardFromList = (listId: string, cardId: string) => {
    setLists(
      lists.map(list =>
        list.id === listId
          ? { ...list, cards: list.cards.filter(card => card.id !== cardId).map((c, i) => ({...c, order: i})) }
          : list
      )
    );
    toast({ title: "Card Deleted", description: "Card has been removed.", variant: "destructive" });
  };

  const updateCardContentInList = (listId: string, cardId: string, newContent: string) => {
    setLists(
      lists.map(list =>
        list.id === listId
          ? { ...list, cards: list.cards.map(card => card.id === cardId ? { ...card, content: newContent } : card) }
          : list
      )
    );
    toast({ title: "Card Updated", description: "Card content has been changed."});
  };

  const moveCard = useCallback(
    (draggedId: string, hoverId: string | null, sourceListId: string, targetListId: string) => {
      setLists(prevLists => {
        const newLists = [...prevLists];
        const sourceListIndex = newLists.findIndex(list => list.id === sourceListId);
        const targetListIndex = newLists.findIndex(list => list.id === targetListId);

        if (sourceListIndex === -1 || targetListIndex === -1) return prevLists;

        const sourceList = { ...newLists[sourceListIndex] };
        sourceList.cards = [...sourceList.cards]; 
        const targetList = sourceListId === targetListId ? sourceList : { ...newLists[targetListIndex] };
        if (sourceListId !== targetListId) {
            targetList.cards = [...targetList.cards];
        }
        
        const draggedCardIndex = sourceList.cards.findIndex(card => card.id === draggedId);
        if (draggedCardIndex === -1) return prevLists;

        const [draggedCard] = sourceList.cards.splice(draggedCardIndex, 1);

        if (hoverId === null) { // Dropped on an empty list or at the end
          targetList.cards.push(draggedCard);
        } else {
          const hoverCardIndex = targetList.cards.findIndex(card => card.id === hoverId);
          if (hoverCardIndex === -1) { // Should not happen if hoverId is not null
             targetList.cards.push(draggedCard); // Fallback: add to end
          } else {
             targetList.cards.splice(hoverCardIndex, 0, draggedCard);
          }
        }
        
        // Re-order cards
        sourceList.cards = sourceList.cards.map((card, idx) => ({ ...card, order: idx }));
        targetList.cards = targetList.cards.map((card, idx) => ({ ...card, order: idx }));

        newLists[sourceListIndex] = sourceList;
        if (sourceListId !== targetListId) {
          newLists[targetListIndex] = targetList;
        }
        
        return newLists;
      });
    },
    [setLists]
  );

  const moveList = useCallback((dragIndex: number, hoverIndex: number) => {
    setLists(prevLists => {
      const newLists = [...prevLists];
      const [draggedList] = newLists.splice(dragIndex, 1);
      newLists.splice(hoverIndex, 0, draggedList);
      return newLists;
    });
  }, [setLists]);


  if (!mounted) {
    // Prevent hydration mismatch by not rendering DND content on server
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary flex items-center">
            <LayoutGrid size={36} className="mr-3 text-accent" /> Organize Now
          </h1>
          <p className="text-muted-foreground">Your personal Trello-style planner.</p>
        </header>
        <div className="text-center p-10">Loading your board...</div>
      </div>
    );
  }


  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary flex items-center">
            <LayoutGrid size={36} className="mr-3 text-accent" /> Organize Now
          </h1>
          <p className="text-muted-foreground">Your personal Trello-style planner.</p>
        </header>

        <div className="mb-8 p-4 bg-card shadow-md rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-foreground">Create New List</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="Enter list title..."
              className="flex-grow"
              aria-label="New list title"
            />
            <Button onClick={addList} className="w-full sm:w-auto" aria-label="Add new list">
              <PlusCircle size={18} className="mr-2" /> Add List
            </Button>
          </div>
        </div>

        <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-secondary/50">
          {lists.map((list, index) => (
            <TaskList
              key={list.id}
              list={list}
              index={index}
              addCardToList={addCardToList}
              deleteCardFromList={deleteCardFromList}
              updateCardContentInList={updateCardContentInList}
              moveCardBetweenLists={moveCard}
              deleteList={deleteList}
              updateListTitle={updateListTitle}
              moveList={moveList}
            />
          ))}
           {lists.length === 0 && (
            <div className="p-10 text-center text-muted-foreground w-full">
                No lists yet. Add one to get started!
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}
