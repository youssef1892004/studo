'use client';

import React, { useEffect, useRef } from 'react';
import { TTSCardData } from '@/lib/types';
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
  cardData: TTSCardData;
  onUpdate: (id: string, data: Partial<TTSCardData>) => void;
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
        data: cardData.data,
        minHeight: 1,
        async onChange(api) {
          try {
            const savedData = await api.saver.save();
            onUpdate(cardData.id, { data: savedData });
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
      className={`group w-full p-2 rounded-lg transition-all duration-150 relative ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}
    >
      {/* --- === تم التعديل هنا: الخط الأزرق على اليمين === --- */}
      <div className={`absolute right-0 top-2 bottom-2 w-1 bg-blue-500 rounded-l-full transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
      
      <div id={holderId} className="prose max-w-full" />
    </div>
  );
}