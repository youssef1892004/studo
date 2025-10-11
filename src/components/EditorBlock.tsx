// src/components/EditorBlock.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { StudioBlock } from '@/lib/types';
import EditorJS, { OutputData } from '@editorjs/editorjs';

// استيراد أدوات المحرر
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import SimpleImage from '@editorjs/simple-image';
import InlineCode from '@editorjs/inline-code';
import CodeTool from '@editorjs/code';
import Delimiter from '@editorjs/delimiter';
import Table from '@editorjs/table';
import Paragraph from '@editorjs/paragraph';

interface EditorBlockProps {
  cardData: StudioBlock;
  onUpdate: (id: string, data: Partial<StudioBlock>) => void;
  isActive: boolean;
  onClick: (id: string) => void;
}

export default function EditorBlock({ cardData, onUpdate, isActive, onClick }: EditorBlockProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderId = `editorjs-${cardData.id}`;

  useEffect(() => {
    if (typeof window !== 'undefined' && !editorRef.current) {
      const editor = new EditorJS({
        holder: holderId,
        tools: {
          paragraph: { class: Paragraph as any, inlineToolbar: true },
          header: { class: Header as any, inlineToolbar: true },
          list: { class: List as any, inlineToolbar: true },
          quote: { class: Quote as any, inlineToolbar: true },
          delimiter: Delimiter as any,
          inlineCode: InlineCode as any,
          code: CodeTool as any,
          table: Table as any,
          image: SimpleImage as any,
        },
        data: cardData.content,
        minHeight: 1,
        async onChange(api) {
          try {
            const savedData = await api.saver.save();
            onUpdate(cardData.id, { content: savedData });
          } catch(e) {
            console.error("Editor.js save error:", e);
          }
        },
      });
      editorRef.current = editor;
    }
    return () => {
      if (editorRef.current?.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onClick={() => onClick(cardData.id)}
      // تطبيق الوضع الداكن على الخلفية النشطة وخلفية التمرير
      className={`group w-full p-2 rounded-lg transition-all duration-150 relative ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}
    >
      {/* الخط الأزرق على اليمين */}
      <div className={`absolute right-0 top-2 bottom-2 w-1 bg-blue-500 rounded-l-full transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
      
      {/* === FIX: تطبيق لون النص الداكن لإجبار المحرر على استخدام نص فاتح في الوضع الليلي === */}
      <div 
          id={holderId} 
          className="prose max-w-full text-gray-900 dark:text-gray-100" 
      />
    </div>
  );
}