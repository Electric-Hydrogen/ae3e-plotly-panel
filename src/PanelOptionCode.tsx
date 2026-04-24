import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { CodeEditor } from '@grafana/ui';

interface Props extends StandardEditorProps<string, any, any> {}

export const PanelOptionCode: React.FC<Props> = ({ value, item, onChange }) => {
  if (typeof value !== 'string') {
    value = JSON.stringify(value, null, 2);
  }
  return (
    <div style={{ marginBottom: 8 }}>
      <CodeEditor
        language={item.settings?.language}
        showLineNumbers={item.settings?.language === 'javascript'}
        value={value === 'null' ? JSON.stringify(item.settings?.initValue, null, 2) : value}
        width="100%"
        height="200px"
        onBlur={(code) => {
          if (item.settings?.language === 'json' && code) {
            code = JSON.parse(code);
          }
          onChange(code);
        }}
      />
    </div>
  );
};
