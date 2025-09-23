import React, { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Normalize Groq markdown to be more standard
function normalizeGroqMarkdown(raw: string): string {
  if (typeof raw !== 'string') {
    try {
      raw = JSON.stringify(raw);
    } catch {
      return '';
    }
  }

  let normalized = raw
    // Convert single-backtick multiline blocks to triple backticks
    .replace(/(^|\n)`([^`]+)`(\n|$)/g, (match, before, code, after) => {
      if (code.includes('\n')) {
        return `${before}\`\`\`python\n${code.trim()}\n\`\`\`${after}`;
      }
      return match;
    })
    // Ensure language identifier is on the same line as backticks
    .replace(/```\s*\n(\s*\w+)/g, '```$1\n')
    // Standardize list markers
    .replace(/^\s*(\d+\.|-|\+)\s+/gm, '* ')
    // Ensure proper spacing around headings and lists
    .replace(/^(#+\s.*?)(\n|$)/gm, '$1\n\n')
    .replace(/^(\*\s.*?)(\n|$)/gm, '$1\n\n')
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n');

  return normalized.trim();
}

const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps): JSX.Element => {
  const safeContent = React.useMemo(() => normalizeGroqMarkdown(content), [content]);

  // Dark mode detection
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Check initial state
    checkDarkMode();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(
      () => console.log('Code copied successfully!'),
      (err) => console.error('Failed to copy code:', err)
    );
  };

  const renderContent = () => {
    const blocks = safeContent.split(/\n\n+/);
      
    return blocks.map((block, idx) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return null;

      // Handle code blocks
      const codeMatch = trimmedBlock.match(/^```(\w+)?\n?([\s\S]*?)```$/);
      if (codeMatch) {
        const lang = codeMatch[1] || 'python';
        const code = codeMatch[2].trim();
            return (
          <div key={idx} className="relative my-4 group">
                <SyntaxHighlighter
              language={lang}
                  style={isDarkMode ? vscDarkPlus : tomorrow}
              className="rounded-lg border border-gray-200 dark:border-gray-600"
                  PreTag="div"
                >
                  {code}
                </SyntaxHighlighter>
            <button
              onClick={() => handleCopyCode(code)}
              className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-500 text-white rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copy code"
            >
              Copy
            </button>
              </div>
            );
          }

      // Handle lists
      if (trimmedBlock.split('\n').every(line => line.trim().startsWith('* '))) {
        return (
          <ul key={idx} className="my-2 list-disc pl-5 space-y-1">
            {trimmedBlock.split('\n').map((line, lineIdx) => (
              <li key={lineIdx}>{processInlineElements(line.trim().substring(2))}</li>
            ))}
          </ul>
        );
      }

      // Handle headings (bold text on its own line)
      if (trimmedBlock.startsWith('**') && trimmedBlock.endsWith('**')) {
        return <h3 key={idx} className="text-lg font-semibold my-3">{trimmedBlock.slice(2, -2)}</h3>;
      }

      // Handle regular paragraphs
      return (
        <p key={idx} className="my-2 leading-relaxed">
          {processInlineElements(trimmedBlock)}
        </p>
      );
    }).filter(Boolean);
  };

  const processInlineElements = (text: string) => {
    return text.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, i) => {
      if (part.startsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`')) {
        return <code key={i} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-1 rounded text-sm">{part.slice(1, -1)}</code>;
    }
      return part;
    });
  };

  return (
    <div className={`markdown-renderer ${className} max-w-none`}>
      {renderContent()}
    </div>
  );
};

// Demo component to test with your example
const Demo = () => {
  const sampleContent = `Excellent! You're making good progress in Module 1.
**Module 1: Introduction to Python Programming (25.0% complete)**
**Lesson 1.4: Basic Operations and Control Structures**
In this lesson, we'll learn about basic operations and control structures in Python.
**Key Takeaways:**
* Basic operations: addition, subtraction, multiplication, division, modulus, etc.
* Control structures: if-else statements, for loops, while loops, etc.
**Task:** Try out the following code snippets in the interactive shell:
\`\`\` x = 5 y = 3 print(x + y) # what will be the output?
for i in range(5): print(i)
x = 0 while x < 5: print(x) x += 1 \`\`\`
**What to do next:**
* Run each code snippet in the interactive shell and observe the output.
* Think about how you can use basic operations and control structures in your own programs.
* When you're ready, move on to the next lesson by typing \`module1.5\` in the chat.
How's your understanding of basic operations and control structures in Python? Do you have any questions or topics you'd like to discuss?
21:15`;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">GroqAI Markdown Renderer Demo</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <MarkdownRenderer content={sampleContent} />
      </div>
    </div>
  );
};

export default MarkdownRenderer; 