'use client';

import React, { useEffect, useRef } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
// تأكد من أن هذه الحزم مثبتة
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';

interface EditorProps {
  data?: OutputData;
  onChange: (data: OutputData) => void;
  holder: string;
}

const Editor: React.FC<EditorProps> = ({ data, onChange, holder }) => {
  // استخدام useRef لتخزين نسخة المحرر
  const editorRef = useRef<EditorJS | null>(null);

  useEffect(() => {
    // التأكد من عدم إنشاء نسخة جديدة من المحرر عند كل إعادة عرض
    if (!editorRef.current) {
      const editor = new EditorJS({
        holder: holder,
        tools: {
          header: Header,
          list: List,
          paragraph: {
            class: Paragraph,
            inlineToolbar: true,
          },
        },
        data: data,
        async onChange(api) {
          const savedData = await api.saver.save();
          onChange(savedData);
        },
      });
      editorRef.current = editor;
    }

    // دالة التنظيف لتدمير نسخة المحرر عند إزالة المكون
    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [holder, data, onChange]); // إضافة الـ dependencies لـ useEffect

  return <div id={holder} className="prose max-w-full rounded-md border p-4" />;
};

export default Editor;