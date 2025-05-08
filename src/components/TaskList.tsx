import type { CardData, ListData, DragItem } from '@/lib/types';
import TaskCard from '@/components/TaskCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Pencil, GripVertical } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useDrop, useDrag, type DropTargetMonitor, type DragSourceMonitor } from 'react-dnd';
import { Card as ShadCard, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'; // Renamed to avoid conflict
import { Textarea } from '@/components/ui/textarea';

interface TaskListProps {
  list: ListData;
  addCardToList: (listId: string, cardContent: string) => void;
  deleteCardFromList: (listId: string, cardId: string) => void;
  updateCardContentInList: (listId: string, cardId: string, newContent: string) => void;
  moveCardBetweenLists: (draggedId: string, hoverId: string | null, sourceListId: string, targetListId: string) => void;
  deleteList: (listId:string) => void;
  updateListTitle: (listId: string, newTitle: string) => void;
  index: number;
  moveList: (dragIndex: number, hoverIndex: number) => void;
}

export default function TaskList({
  list,
  addCardToList,
  deleteCardFromList,
  updateCardContentInList,
  moveCardBetweenLists,
  deleteList,
  updateListTitle,
  index,
  moveList
}: TaskListProps) {
  const [newCardContent, setNewCardContent] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);
  const ref = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLTextAreaElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: any }>({
    accept: 'CARD',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    drop: (item, monitor) => {
      // This handles dropping a card onto an empty list or at the end of a list
      if (monitor.didDrop()) {
        return;
      }
      if (item.type === 'CARD' && item.listId !== list.id) {
         moveCardBetweenLists(item.id, null, item.listId, list.id);
      }
    },
    hover: (item, monitor) => {
        // Handle card hovering over an empty list
        if (item.type === 'CARD' && list.cards.length === 0 && item.listId !== list.id) {
            if (monitor.isOver({ shallow: true })) {
                moveCardBetweenLists(item.id, null, item.listId, list.id);
                item.listId = list.id; // Update item's listId to prevent multiple moves
                item.index = 0; // Update index as it's the only card
            }
        }
    }
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'LIST',
    item: () => ({ id: list.id, index, type: 'LIST' }),
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // For list reordering
  const [, listDrop] = useDrop<DragItem, void, unknown>({
    accept: 'LIST',
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.originalIndex!; // originalIndex is set when drag begins
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }
      
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientX = clientOffset!.x - hoverBoundingRect.left;

      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
        return;
      }
      
      moveList(dragIndex, hoverIndex);
      item.originalIndex = hoverIndex; 
    },
  });
  
  drag(listDrop(ref)); // Apply drag to the entire list for reordering
  drop(ref); // Apply drop for cards to the list content area

  useEffect(() => {
    preview(ref);
  }, [preview]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);
  
  useEffect(() => {
    if (isAddingCard && cardInputRef.current) {
      cardInputRef.current.focus();
    }
  }, [isAddingCard]);

  const handleAddCard = () => {
    if (newCardContent.trim() === '') return;
    addCardToList(list.id, newCardContent);
    setNewCardContent('');
    setIsAddingCard(false);
  };

  const handleToggleAddCard = () => {
    setIsAddingCard(!isAddingCard);
    setNewCardContent(''); 
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim() === '') return;
    updateListTitle(list.id, editedTitle);
    setIsEditingTitle(false);
  };

  const handleCancelEditTitle = () => {
    setEditedTitle(list.title);
    setIsEditingTitle(false);
  };


  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }} className="animate-fade-in w-[300px] flex-shrink-0">
      <ShadCard className="bg-secondary shadow-lg rounded-lg h-full flex flex-col" data-handler-id={handlerId}>
        <CardHeader className="p-3 flex flex-row items-center justify-between bg-secondary-foreground/10 rounded-t-lg cursor-grab" ref={drag}>
          {isEditingTitle ? (
            <div className="flex-grow">
              <Input
                ref={titleInputRef}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') handleCancelEditTitle(); }}
                className="text-lg font-semibold h-9"
                aria-label="Edit list title"
              />
            </div>
          ) : (
            <CardTitle 
              className="text-lg font-semibold text-secondary-foreground cursor-pointer hover:text-primary"
              onClick={() => setIsEditingTitle(true)}
              onFocus={() => setIsEditingTitle(true)} // Allow keyboard focus to trigger edit
              tabIndex={0} // Make it focusable
              onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') setIsEditingTitle(true)}} // Allow Enter/Space to trigger edit
              aria-label={`List title: ${list.title}. Click to edit.`}
            >
              {list.title}
            </CardTitle>
          )}
          <div className="flex items-center">
            {!isEditingTitle && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-secondary-foreground hover:text-primary" onClick={() => setIsEditingTitle(true)} aria-label="Edit list title">
                <Pencil size={16} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive-foreground hover:bg-destructive" onClick={() => deleteList(list.id)} aria-label={`Delete list ${list.title}`}>
              <Trash2 size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent ref={drop} className="p-3 flex-grow overflow-y-auto min-h-[100px]">
          {list.cards.map((card, cardIndex) => (
            <TaskCard
              key={card.id}
              card={card}
              listId={list.id}
              index={cardIndex}
              moveCard={moveCardBetweenLists}
              deleteCard={deleteCardFromList}
              updateCardContent={updateCardContentInList}
            />
          ))}
          {list.cards.length === 0 && !isAddingCard && (
             <div className="text-center text-muted-foreground py-4">
               Drag cards here or add a new one.
             </div>
          )}
        </CardContent>
        <CardFooter className="p-3 border-t border-border">
          {isAddingCard ? (
            <div className="w-full">
              <Textarea
                ref={cardInputRef}
                value={newCardContent}
                onChange={(e) => setNewCardContent(e.target.value)}
                placeholder="Enter card content..."
                className="mb-2 min-h-[60px]"
                aria-label="New card content"
              />
              <div className="flex gap-2">
                <Button onClick={handleAddCard} size="sm" aria-label="Add new card">Add Card</Button>
                <Button variant="ghost" onClick={handleToggleAddCard} size="sm" aria-label="Cancel adding card">Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={handleToggleAddCard} className="w-full" aria-label="Add a new card to this list">
              <Plus size={16} className="mr-2" /> Add Card
            </Button>
          )}
        </CardFooter>
      </ShadCard>
    </div>
  );
}
