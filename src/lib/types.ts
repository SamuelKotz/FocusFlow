export interface CardData {
  id: string;
  content: string;
  order: number;
}

export interface ListData {
  id: string;
  title: string;
  cards: CardData[];
}

export interface DragItem {
  type: 'CARD' | 'LIST';
  id: string;
  listId?: string; // Only for CARD type
  originalIndex?: number; // For LIST reordering
}
