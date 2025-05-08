import type { CardData } from '@/lib/types';
import { useDrag, useDrop, type DropTargetMonitor } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import React, { useState, useRef, useEffect } from 'react';

interface TaskCardProps {
  card: CardData;
  listId: string;
  index: number;
  moveCard: (draggedId: string, hoverId: string, sourceListId: string, targetListId: string) => void;
  deleteCard: (listId: string, cardId: string) => void;
  updateCardContent: (listId: string, cardId: string, newContent: string) => void;
}

interface DragItem {
  id: string;
  listId: string;
  index: number;
  type: 'CARD';
}

export default function TaskCard({ card, listId, index, moveCard, deleteCard, updateCardContent }: TaskCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(card.content);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: any }>({
    accept: 'CARD',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      const sourceListId = item.listId;

      if (dragIndex === hoverIndex && sourceListId === listId) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveCard(item.id, card.id, sourceListId, listId);
      item.index = hoverIndex;
      item.listId = listId;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'CARD',
    item: () => ({ id: card.id, listId, index, type: 'CARD' }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  useEffect(() => {
    preview(ref); // Attach preview to the entire card
  }, [preview]);


  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedContent.trim() === '') return;
    updateCardContent(listId, card.id, editedContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(card.content);
    setIsEditing(false);
  };

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="mb-2 animate-fade-in"
      aria-grabbed={isDragging}
    >
      <Card className="bg-card shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out group">
        <CardContent className="p-3 flex items-start justify-between">
          {isEditing ? (
            <div className="flex-grow mr-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="mb-2 min-h-[60px]"
                aria-label="Edit card content"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} aria-label="Save card changes">Save</Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit} aria-label="Cancel editing card">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex-grow mr-2 cursor-grab" ref={drag}>
              <p className="text-sm text-card-foreground break-words whitespace-pre-wrap">{card.content}</p>
            </div>
          )}
          <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {!isEditing && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEdit} aria-label="Edit card">
                <Pencil size={16} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive-foreground hover:bg-destructive" onClick={() => deleteCard(listId, card.id)} aria-label="Delete card">
              <Trash2 size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
