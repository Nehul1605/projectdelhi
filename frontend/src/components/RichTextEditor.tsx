import React, { useRef, useEffect, useState } from "react";
import { Bold, Italic, Undo, Redo } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  id?: string;
  rows?: number;
  style?: React.CSSProperties;
  name?: string;
}

export function RichTextEditor({
  value,
  onChange,
  maxLength,
  placeholder,
  id,
  rows = 5,
  style,
  name,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [charCount, setCharCount] = useState(0);

  // Sync value from props to DOM when value changes externally (e.g. initial load or modal reset)
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
        updateCount();
      }
    }
  }, [value]);

  const updateCount = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || "";
      setCharCount(text.trim() === "" ? 0 : text.length);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      let html = editorRef.current.innerHTML;

      // Handle completely empty content-editable clean state
      if (editorRef.current.innerText.trim() === "" && (editorRef.current.innerHTML === "<br>" || editorRef.current.innerHTML === "<div><br></div>")) {
        html = "";
        editorRef.current.innerHTML = "";
      }

      const text = editorRef.current.innerText || "";
      setCharCount(text.trim() === "" ? 0 : text.length);
      onChange(html);
    }
  };

  const executeCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateCount();
    }
  };

  const handleCaseChange = (caseType: 'upper' | 'lower' | 'sentence') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText) return;

    let newText = selectedText;
    if (caseType === 'upper') {
      newText = selectedText.toUpperCase();
    } else if (caseType === 'lower') {
      newText = selectedText.toLowerCase();
    } else if (caseType === 'sentence') {
      newText = selectedText.charAt(0).toUpperCase() + selectedText.slice(1).toLowerCase();
    }

    range.deleteContents();
    range.insertNode(document.createTextNode(newText));

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateCount();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const minHeight = rows * 24 + 20;

  return (
    <div className="rich-text-editor-container" style={{ display: 'flex', flexDirection: 'column', width: '100%', ...style }}>
      {/* Sleek Toolbar */}
      <div className="rte-toolbar">
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className="rte-btn"
          title="Bold"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className="rte-btn"
          title="Italic"
        >
          <Italic size={15} />
        </button>

        <div className="rte-divider" />

        <button
          type="button"
          onClick={() => handleCaseChange('upper')}
          className="rte-btn rte-text-btn"
          title="UPPERCASE selection"
        >
          AA
        </button>
        <button
          type="button"
          onClick={() => handleCaseChange('lower')}
          className="rte-btn rte-text-btn"
          title="lowercase selection"
        >
          aa
        </button>
        <button
          type="button"
          onClick={() => handleCaseChange('sentence')}
          className="rte-btn rte-text-btn"
          title="Sentence case selection"
        >
          Aa
        </button>

        <div className="rte-divider" />

        <button
          type="button"
          onClick={() => executeCommand('undo')}
          className="rte-btn"
          title="Undo"
        >
          <Undo size={14} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('redo')}
          className="rte-btn"
          title="Redo"
        >
          <Redo size={14} />
        </button>

        <div className="rte-counter" style={{ color: charCount > maxLength ? 'var(--danger)' : 'var(--text-muted)' }}>
          {charCount} / {maxLength}
        </div>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        id={id}
        data-placeholder={placeholder}
        style={{ minHeight: `${minHeight}px` }}
        className="rte-editor-area"
      />
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}

// Strip HTML tags for card / previews
export function stripHtml(html: string): string {
  if (!html) return "";
  // Replace tags with spaces, then consolidate consecutive spaces
  const formatted = html
    .replace(/<\/p>|<br\s*\/?>|<\/div>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ');
  return formatted.trim();
}

// Display HTML content safely or pre-wrap legacy plain text
interface RichTextDisplayProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

export function RichTextDisplay({ content, className, style }: RichTextDisplayProps) {
  if (!content) return null;

  // Check if content has HTML tags
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);

  if (hasHtml) {
    // Basic sanitization to prevent onload/onerror and script injections
    const cleanHtml = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');

    return (
      <div
        className={className}
        style={{ ...style, lineHeight: '1.6' }}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  // Fallback to plain text with pre-wrap
  return (
    <div className={className} style={{ ...style, whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
      {content}
    </div>
  );
}
