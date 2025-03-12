import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function OutputPanel({ output, activeTab, processes }) {
  const processId = activeTab !== 'pipeline' && activeTab !== 'files' ? activeTab : null;
  const selectedProcess = processes?.find(p => p.id === processId);
  const processOutput = processId && output && output.processId === processId ? output : null;
  const processName = selectedProcess?.name || '';
  const headerTitle = processId ? `${processName} Output` : 'Output';

  const getSampleOutput = () => {
    if (!processId) return null;
    const samples = {
      'code-review': {
        content: "## Code Review Results\n\n### main.js\n- Function `calculateTotal()` lacks input validation\n- Consider adding error handling for edge cases\n\n### utils.js\n- Good use of modular design\n- Line 42: Potential memory leak in event listener",
        status: 'sample',
        timestamp: new Date().toISOString()
      },
      'test-planning': {
        content: "## Test Planning Document\n\n### Test Objectives\n1. Validate user authentication flows\n2. Verify data integrity across transactions\n\n### Test Scenarios\n- Login with valid credentials\n- Login with invalid credentials\n- Password reset flow",
        status: 'sample',
        timestamp: new Date().toISOString()
      },
      'requirement-analysis': {
        content: "## Requirements Analysis\n\n### Functional Requirements\n- User registration system\n- Product catalog browsing\n- Shopping cart functionality\n\n### Non-Functional Requirements\n- System should support 1000 concurrent users\n- Page load time < 2 seconds",
        status: 'sample',
        timestamp: new Date().toISOString()
      },
      'environment-setup': {
        content: "## Environment Setup Guide\n\n### Development Environment\n```\nnpm install\nnpm run setup-dev\n```\n\n### Testing Environment\n```\ndocker-compose up -d\nnpm run setup-test\n```",
        status: 'sample',
        timestamp: new Date().toISOString()
      },
      'test-scenario-generation': {
        content: "## Generated Test Scenarios\n\n### User Authentication\n1. **TC001**: Verify login with valid username and password\n2. **TC002**: Verify login with invalid credentials\n3. **TC003**: Verify password reset functionality\n\n### Shopping Cart\n1. **TC004**: Add single item to cart\n2. **TC005**: Add multiple items to cart",
        status: 'sample',
        timestamp: new Date().toISOString()
      }
    };
    return samples[processId] || {
      content: `# ${processName} Output\n\nRun this process to see actual output here.`,
      status: 'sample',
      timestamp: new Date().toISOString()
    };
  };

  const displayOutput = processOutput || (processId && !output ? getSampleOutput() : output);

  const renderContent = () => {
    if (!displayOutput) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="text-gray-400">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">
              {processId ? `Run ${processName} to see actual output here` : 'Run a process to see the output here'}
            </p>
          </div>
        </div>
      );
    }

    // content'ın string olduğundan emin olalım
    const content = typeof displayOutput.content === 'string' ? displayOutput.content : JSON.stringify(displayOutput.content || 'No content available');

    return (
      <div className="space-y-4">
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Process Results</h3>
            {displayOutput.status === 'sample' && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                Sample
              </span>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="prose prose-sm max-w-none text-gray-600">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium mb-3">Execution Details</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="text-gray-600">
              <p><strong>Status:</strong> {displayOutput.status === 'sample' ? 'Not Run' : displayOutput.status}</p>
              <p><strong>Process:</strong> {processName || displayOutput.processType || 'Unknown'}</p>
              <p><strong>Last Updated:</strong> {new Date(displayOutput.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none h-16 px-6 flex items-center justify-between border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-900">{headerTitle}</h2>
        {processId && (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
            {processId}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {renderContent()}
      </div>
      <div className="flex-none h-16 px-6 flex items-center border-t border-gray-200 bg-white">
        <button
          className={`w-full py-2 px-4 rounded-md text-white transition-colors shadow-sm ${
            !displayOutput || displayOutput.status === 'sample'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
          disabled={!displayOutput || displayOutput.status === 'sample'}
        >
          Install Output
        </button>
      </div>
    </div>
  );
}