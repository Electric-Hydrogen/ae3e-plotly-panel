import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { CodeEditor } from '@grafana/ui';

interface Props extends StandardEditorProps<string, any, any> {}

export const PanelOptionCode: React.FC<Props> = ({ value, item, onChange }) => {
  if (typeof value !== 'string') {
    value = JSON.stringify(value, null, 2);
  }

  const language = item.settings?.language ?? 'json';
  const isJson = language === 'json';
  const editorValue = value === 'null' ? JSON.stringify(item.settings?.initValue, null, 2) : (value ?? '');

  // Measure container width so Monaco gets an explicit pixel value instead of
  // relying on "100%" which can resolve to 0 in Grafana 12.3+ panel options pane.
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorWidth, setEditorWidth] = useState<number | string>('100%');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) {
        setEditorWidth(w);
      }
    });
    observer.observe(el);
    // Seed with current width immediately
    const initial = el.getBoundingClientRect().width;
    if (initial > 0) {
      setEditorWidth(initial);
    }
    return () => observer.disconnect();
  }, []);

  // On mount, force the editor and any sandboxed ancestor to receive pointer events.
  const handleEditorDidMount = useCallback((editor: any) => {
    editor.updateOptions({ readOnly: false });
    const domNode: HTMLElement | null = editor.getDomNode?.() ?? null;
    if (domNode) {
      domNode.style.pointerEvents = 'auto';
      // Walk up and ensure no ancestor blocks pointer events
      let el: HTMLElement | null = domNode.parentElement;
      while (el) {
        const style = window.getComputedStyle(el);
        if (style.pointerEvents === 'none') {
          el.style.pointerEvents = 'auto';
        }
        if (el.hasAttribute('data-plugin-sandbox')) {
          el.style.pointerEvents = 'auto';
          break;
        }
        el = el.parentElement;
      }
    }
  }, []);

  const handleBlur = useCallback(
    (code: string) => {
      if (isJson && code) {
        try {
          onChange(JSON.parse(code));
          return;
        } catch {
          // fall through — store raw string if JSON is malformed
        }
      }
      onChange(code);
    },
    [isJson, onChange]
  );

  // For non-JSON editors keep Grafana options in sync on every change so the
  // value is not lost if the user closes the panel editor without blurring.
  const handleChange = useCallback(
    (code: string) => {
      if (!isJson) {
        onChange(code);
      }
    },
    [isJson, onChange]
  );

  return (
    <div
      ref={containerRef}
      style={{ marginBottom: 8, minHeight: 204, pointerEvents: 'auto', position: 'relative' }}
    >
      <CodeEditor
        language={language}
        showLineNumbers={language === 'javascript'}
        value={editorValue}
        width={editorWidth}
        height={200}
        readOnly={false}
        onEditorDidMount={handleEditorDidMount}
        onBlur={handleBlur}
        onChange={handleChange}
      />
    </div>
  );
};
