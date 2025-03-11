import React from 'react';
import { clsx } from 'clsx';
import FileUpload from './FileUpload';
import PromptEditor from './PromptEditor';

const tabs = [
  { id: 'description', name: 'Description' },
  { id: 'inputs', name: 'Required Inputs' },
  { id: 'configuration', name: 'Process Configuration' },
  { id: 'files', name: 'Files' },
  { id: 'prompt', name: 'Prompt' }
];

export default function ProcessPanel({
  process,
  files,
  prompt,
  activeTab,
  onTabChange,
  onFileUpload,
  onPromptUpdate,
  onRun
}) {
  return (
    <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
      <div className="border-b border-gray-200">
        <div className="flex space-x-4 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'py-4 px-2 text-sm font-medium border-b-2',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'description' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Process Overview</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              {process.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'inputs' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Required Inputs</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              {process.inputs.map((input, index) => (
                <li key={index}>{input}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'configuration' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Process Configuration</h3>
            <p className="text-gray-600">Configure settings for {process.name}</p>
            {/* Add configuration options specific to the process */}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">File Management</h3>
            <FileUpload
              processId={process.id}
              onFilesSelected={onFileUpload}
              existingFiles={files}
              allowMultiple={true}
            />
          </div>
        )}

        {activeTab === 'prompt' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Process Prompt</h3>
            <PromptEditor
              value={prompt || ''}
              onChange={(value) => onPromptUpdate(process.id, value)}
              placeholder={`Enter instructions for ${process.name}...`}
            />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        console.alert("Process Cem is running");
        <button
          onClick={onRun}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Run Process
        </button>
      </div>
    </div>
  );
}