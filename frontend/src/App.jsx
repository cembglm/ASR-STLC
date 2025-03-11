import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TabPanel from './components/TabPanel';
import { processes } from './data/processes';
import { processService } from './services/processService';
import { codeReviewService } from './services/codeReviewService';

export default function App() {
  // Combined states from both App.jsx files
  const [selectedProcesses, setSelectedProcesses] = useState(new Set());
  const [processOrigins, setProcessOrigins] = useState({}); // { processId: 'manual' | 'auto' }
  const [processFiles, setProcessFiles] = useState({});
  const [processPrompts, setProcessPrompts] = useState({});
  const [output, setOutput] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState({});
  const [activeTab, setActiveTab] = useState('pipeline');
  const [validationError, setValidationError] = useState(null);
  const [isPipelineEnabled, setIsPipelineEnabled] = useState(true);
  
  // Centralized file management states from first App.jsx
  const [managedFiles, setManagedFiles] = useState([]);
  const [fileProcessMappings, setFileProcessMappings] = useState({});
  const [selectedFileIds, setSelectedFileIds] = useState(new Set());

  // Combined file upload function that supports both direct and centralized file management
  const handleFileUpload = async (processIdOrFiles, fileTypeOrInfo) => {
    console.log('[App] File upload triggered');
    
    // Check if it's called with files array (centralized management)
    if (Array.isArray(processIdOrFiles)) {
      try {
        const files = processIdOrFiles;
        const fileType = fileTypeOrInfo;
        console.log(`[App] Centralized file upload with type: ${fileType}`);
        
        const newFiles = await Promise.all(
          Array.from(files).map(async file => {
            const fileData = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: file.name,
              type: fileType || file.type,
              size: file.size,
              content: await file.text(),
              uploadDate: new Date().toISOString()
            };
            return fileData;
          })
        );

        setManagedFiles(prev => [...prev, ...newFiles]);
      } catch (error) {
        console.error('File upload error:', error);
        setValidationError('An error occurred while uploading the file');
      }
    } 
    // Otherwise it's called with direct process file mapping
    else {
      const processId = processIdOrFiles;
      const fileInfo = fileTypeOrInfo;
      console.log(`[App] Direct file upload for process ${processId}: ${fileInfo.file.name} (type: ${fileInfo.type})`);
      
      setProcessFiles(prev => ({
        ...prev,
        [processId]: [...(prev[processId] || []), fileInfo]
      }));
    }
  };

  const handlePromptUpdate = (processId, newPrompt) => {
    console.log(`[App] Prompt updated for process ${processId}: ${newPrompt}`);
    setProcessPrompts(prev => ({
      ...prev,
      [processId]: newPrompt
    }));
  };

  // Complex process selection function from second App.jsx with automatic selection features
  const handleProcessSelect = (processId) => {
    console.log(`[App] Process ${processId} selection triggered`);
    setSelectedProcesses(prevSelected => {
      const newSet = new Set(prevSelected);
      const newOrigins = { ...processOrigins };
      const wasSelected = newSet.has(processId);

      // Toggle selection
      if (wasSelected) {
        newSet.delete(processId);
        delete newOrigins[processId];
        console.log(`[App] Removed ${processId} manually`);
      } else {
        newSet.add(processId);
        newOrigins[processId] = 'manual';
        console.log(`[App] Added ${processId} manually`);
      }

      // Pipeline etkin değilse sadece seçimi güncelle
      if (!isPipelineEnabled) {
        setProcessOrigins(newOrigins);
        return newSet;
      }

      // Process indeksleri
      const testPlanningIndex = processes.findIndex(p => p.id === 'test-planning');
      const envSetupIndex = processes.findIndex(p => p.id === 'environment-setup');
      
      // Mevcut süreçlerin durumları
      const isTestPlanningSelected = newSet.has('test-planning');
      const isEnvSetupSelected = newSet.has('environment-setup');
      const isTestPlanningManual = isTestPlanningSelected && newOrigins['test-planning'] === 'manual';
      const isEnvSetupManual = isEnvSetupSelected && newOrigins['environment-setup'] === 'manual';

      // Tüm süreçlerin indeksleriyle birlikte listesi
      const allProcesses = Array.from(newSet).map(id => ({
        id,
        index: processes.findIndex(p => p.id === id)
      }));

      // Test Planning ve Environment Setup dışındaki süreçler
      const otherProcesses = allProcesses.filter(
        item => item.id !== 'test-planning' && item.id !== 'environment-setup'
      );

      // Sadece bir süreç varsa ve bu requirement-analysis veya test-scenario-generation ise
      const hasOnlyRequirementAnalysis = otherProcesses.length === 1 && 
        otherProcesses[0].id === 'requirement-analysis';
      
      const hasOnlyTestScenarioGeneration = otherProcesses.length === 1 && 
        otherProcesses[0].id === 'test-scenario-generation';

      console.log(`[App] Has only requirement-analysis: ${hasOnlyRequirementAnalysis}`);
      console.log(`[App] Has only test-scenario-generation: ${hasOnlyTestScenarioGeneration}`);

      // Ardışık süreçleri kontrol et (herhangi iki süreç arasında)
      let hasConsecutive = false;
      
      // Tüm süreç çiftlerini kontrol et
      for (let i = 0; i < otherProcesses.length; i++) {
        for (let j = i + 1; j < otherProcesses.length; j++) {
          const indexA = otherProcesses[i].index;
          const indexB = otherProcesses[j].index;
          
          // Eğer herhangi iki süreç ardışıksa
          if (Math.abs(indexA - indexB) === 1) {
            hasConsecutive = true;
            console.log(`[App] Found consecutive pair: ${otherProcesses[i].id} (${indexA}) and ${otherProcesses[j].id} (${indexB})`);
            break;
          }
        }
        if (hasConsecutive) break;
      }

      // Requirement-analysis veya test-planning seçildiğinde
      const hasRequirementAnalysis = otherProcesses.some(p => p.id === 'requirement-analysis');
      const isRequirementAnalysisAndTestPlanning = hasRequirementAnalysis && isTestPlanningSelected;
      
      // Environment-setup veya test-scenario-generation seçildiğinde
      const hasTestScenarioGeneration = otherProcesses.some(p => p.id === 'test-scenario-generation');
      const isEnvSetupAndTestScenarioGeneration = hasTestScenarioGeneration && isEnvSetupSelected;
      
      console.log(`[App] Has requirement-analysis: ${hasRequirementAnalysis}`);
      console.log(`[App] Is requirement-analysis and test-planning: ${isRequirementAnalysisAndTestPlanning}`);
      console.log(`[App] Has test-scenario-generation: ${hasTestScenarioGeneration}`);
      console.log(`[App] Is environment-setup and test-scenario-generation: ${isEnvSetupAndTestScenarioGeneration}`);
      
      // Requirement-analysis VE test-planning seçili ise, sadece environment-setup eklensin
      if (isRequirementAnalysisAndTestPlanning && !isEnvSetupManual && !isEnvSetupSelected) {
        newSet.add('environment-setup');
        newOrigins['environment-setup'] = 'auto';
        console.log('[App] Added only environment-setup as auto (due to requirement-analysis AND test-planning)');
      }
      // Environment-setup VE test-scenario-generation seçili ise, sadece test-planning eklensin
      else if (isEnvSetupAndTestScenarioGeneration && !isTestPlanningManual && !isTestPlanningSelected) {
        newSet.add('test-planning');
        newOrigins['test-planning'] = 'auto';
        console.log('[App] Added only test-planning as auto (due to environment-setup AND test-scenario-generation)');
      }
      // Herhangi başka iki süreç arasında ardışıklık varsa
      else if (hasConsecutive) {
        if (!isTestPlanningManual && !isTestPlanningSelected) {
          newSet.add('test-planning');
          newOrigins['test-planning'] = 'auto';
          console.log('[App] Added test-planning as auto (due to consecutive processes)');
        }
        if (!isEnvSetupManual && !isEnvSetupSelected) {
          newSet.add('environment-setup');
          newOrigins['environment-setup'] = 'auto';
          console.log('[App] Added environment-setup as auto (due to consecutive processes)');
        }
      }
      // Hiçbir ardışık süreç yoksa VE özel senaryolardan hiçbiri yoksa
      // otomatik eklenmiş süreçleri kaldır
      if (!hasConsecutive && 
          !isRequirementAnalysisAndTestPlanning &&
          !isEnvSetupAndTestScenarioGeneration) {
        if (newOrigins['test-planning'] === 'auto') {
          newSet.delete('test-planning');
          delete newOrigins['test-planning'];
          console.log('[App] Removed auto test-planning - no consecutive processes');
        }
        if (newOrigins['environment-setup'] === 'auto') {
          newSet.delete('environment-setup');
          delete newOrigins['environment-setup'];
          console.log('[App] Removed auto environment-setup - no consecutive processes');
        }
      }

      console.log(`[App] Final selectedProcesses: ${Array.from(newSet)}`);
      console.log(`[App] Final processOrigins: ${JSON.stringify(newOrigins)}`);
      setProcessOrigins(newOrigins);
      return newSet;
    });
  };

  const validatePipeline = () => {
    console.log('[App] Validating pipeline');
    const missingInputs = [];
    
    selectedProcesses.forEach(processId => {
      const process = processes.find(p => p.id === processId);
      const files = processFiles[processId] || [];
      
      const missingRequiredInputs = process.inputs.filter(input => {
        return !files.some(file => file.type === input);
      });
      
      if (missingRequiredInputs.length > 0) {
        missingInputs.push({
          process: process.name,
          inputs: missingRequiredInputs
        });
      }
    });
    
    console.log(`[App] Validation result: ${missingInputs.length > 0 ? JSON.stringify(missingInputs) : 'Valid'}`);
    return missingInputs;
  };

  // File management functions from first App.jsx
  const handleFileDelete = (fileId) => {
    console.log(`[App] Deleting file: ${fileId}`);
    setManagedFiles(prev => prev.filter(f => f.id !== fileId));
    setFileProcessMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[fileId];
      return newMappings;
    });
  };

  const handleFileProcessMapping = (fileId, processes) => {
    console.log(`[App] Mapping file ${fileId} to processes: ${processes}`);
    setFileProcessMappings(prev => ({
      ...prev,
      [fileId]: processes
    }));
    
    // Automatically update process files
    processes.forEach(processId => {
      const fileInfo = managedFiles.find(f => f.id === fileId);
      if (fileInfo) {
        setProcessFiles(prev => ({
          ...prev,
          [processId]: [...(prev[processId] || []), fileInfo]
        }));
      }
    });
  };

  // Enhanced process run function that combines both implementations
  const handleProcessRun = async (processId, filesArg) => {
    console.log(`[App] Starting process with processId: '${processId}'`);
    
    try {
      setPipelineStatus(prev => ({
        ...prev,
        [processId]: 'running'
      }));
      console.log(`[App] Pipeline status set to 'running' for ${processId}`);
      
      // Determine files to use - support both direct file passing and centralized file management
      let files = filesArg;
      if (!files) {
        // If no files are directly provided, check if we should use centralized file management
        const relevantFiles = managedFiles.filter(file => 
          fileProcessMappings[file.id]?.includes(processId)
        );
        
        if (relevantFiles.length > 0) {
          files = relevantFiles;
          console.log(`[App] Using ${relevantFiles.length} files from centralized management`);
        } else {
          files = processFiles[processId] || [];
          console.log(`[App] Using ${files.length} files from process-specific storage`);
        }
      }
      
      console.log(`[App] Processing with ${files.length} files`);
      
      let result;
      if (processId === 'code-review') {
        console.log('[App] Running code review');
        result = await processService.runCodeReview(files);
        setOutput({
          content: result.reviews.map(review => 
            `## ${review.file_name}\n\n${review.review}\n\n---\n`
          ).join('\n'),
          status: 'completed',
          processType: 'Code Review',
          processId: processId, // processId bilgisini ekliyoruz
          timestamp: new Date().toISOString()
        });
        console.log('[App] Code review completed, output set');
      } else if (processId === 'test-planning') {
        console.log('[App] Running test planning');
        const formData = new FormData();
        files.forEach(fileInfo => {
          // Handle both centralized and direct file formats
          const file = fileInfo.file || fileInfo;
          formData.append('files', file);
          console.log(`[App] Added file to FormData: ${file.name || fileInfo.name}`);
        });
  
        console.log('[App] Sending POST request to http://localhost:8000/api/processes/test-planning/run');
        const response = await fetch('http://localhost:8000/api/processes/test-planning/run', {
          method: 'POST',
          body: formData,
        });
  
        console.log(`[App] Response status: ${response.status}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[App] HTTP error: ${response.status} - ${errorText}`);
          throw new Error(`Backend error: ${response.status} - ${errorText}`);
        }
  
        result = await response.json();
        console.log(`[App] Backend response: ${JSON.stringify(result)}`);
        setOutput({
          content: result.error ? `Error: ${result.error}` : result.result,
          status: result.error ? 'error' : 'completed',
          processType: 'Test Planning',
          processId: processId, // processId bilgisini ekliyoruz
          timestamp: new Date().toISOString()
        });
        console.log('[App] Test planning completed, output set');
      } else if (processId === 'requirement-analysis') {
        // Örnek gereksinim analizi çıktısı
        setOutput({
          content: `# Requirement Analysis Results\n\n## Functional Requirements\n1. User authentication system\n2. Data storage and retrieval\n3. Real-time notification system\n\n## Non-Functional Requirements\n1. Performance: System should handle 1000 concurrent users\n2. Security: Implement OAuth 2.0 for authentication\n3. Reliability: 99.9% uptime guarantee`,
          status: 'completed',
          processType: 'Requirement Analysis',
          processId: processId,
          timestamp: new Date().toISOString()
        });
        console.log('[App] Requirement analysis completed, output set');
      } else if (processId === 'environment-setup') {
        // Örnek ortam kurulumu çıktısı
        setOutput({
          content: `# Environment Setup Completed\n\n## Development Environment\n- Node.js v16.14.2\n- React v18.2.0\n- PostgreSQL v14.3\n\n## Test Environment\n- Jest v28.1.0\n- Cypress v10.3.0\n\n## Configuration\n\`\`\`\nAPP_PORT=3000\nDB_CONNECTION=postgresql://user:password@localhost:5432/testdb\nJWT_SECRET=test_secret_key\n\`\`\``,
          status: 'completed',
          processType: 'Environment Setup',
          processId: processId,
          timestamp: new Date().toISOString()
        });
        console.log('[App] Environment setup completed, output set');
      } else if (processId === 'test-scenario-generation') {
        // Örnek test senaryosu çıktısı
        setOutput({
          content: `# Generated Test Scenarios\n\n## Authentication Tests\n1. TC001: Valid login with correct credentials\n2. TC002: Invalid login with incorrect password\n3. TC003: Password reset functionality\n\n## Data Management Tests\n1. TC004: Create new record\n2. TC005: Update existing record\n3. TC006: Delete record\n\n## Integration Tests\n1. TC007: End-to-end user registration flow\n2. TC008: Complete order processing workflow`,
          status: 'completed',
          processType: 'Test Scenario Generation',
          processId: processId,
          timestamp: new Date().toISOString()
        });
        console.log('[App] Test scenario generation completed, output set');
      } else {
        // Diğer süreçler için genel bir mesaj
        setOutput({
          content: `# ${processId} Process Output\n\nSuccessfully completed the ${processId} process.\n\n## Details\n- Process ID: ${processId}\n- Timestamp: ${new Date().toISOString()}\n- Files processed: ${files.length}\n\n## Summary\nAll operations completed successfully with no errors.`,
          status: 'completed',
          processType: processId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          processId: processId,
          timestamp: new Date().toISOString()
        });
        console.log(`[App] Process ${processId} completed, output set`);
      }
  
      setPipelineStatus(prev => ({
        ...prev,
        [processId]: 'completed'
      }));
      console.log(`[App] Pipeline status set to 'completed' for ${processId}`);
    } catch (error) {
      console.error(`[App] Process ${processId} failed: ${error.message}`);
      setPipelineStatus(prev => ({
        ...prev,
        [processId]: 'error'
      }));
      setOutput({
        content: `Error: ${error.message}`,
        status: 'error',
        processType: processes.find(p => p.id === processId)?.name || 'Unknown Process',
        processId: processId,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Pipeline başlatma fonksiyonu
  const handleStartPipeline = async () => {
    console.log('[App] Starting pipeline');
    
    // Seçilen süreçleri sırayla çalıştır
    const selectedProcessIds = Array.from(selectedProcesses);
    
    // Önce tüm süreç durumlarını "pending" olarak ayarla
    setPipelineStatus(prev => {
      const newStatus = { ...prev };
      selectedProcessIds.forEach(id => {
        newStatus[id] = 'pending';
      });
      return newStatus;
    });
    
    // Süreçleri sırayla çalıştır
    for (const processId of selectedProcessIds) {
      console.log(`[App] Running pipeline step: ${processId}`);
      
      try {
        // Mevcut sürecin durumunu "running" olarak güncelle
        setPipelineStatus(prev => ({
          ...prev,
          [processId]: 'running'
        }));
        
        // Süreç için dosyaları belirle
        const relevantFiles = managedFiles.filter(file => 
          fileProcessMappings[file.id]?.includes(processId)
        );
        
        // Süreç çalıştırma fonksiyonunu çağır ve sonuçları bekle
        await handleProcessRun(processId, relevantFiles);
        
        // Kısa bir bekleme süresi ekle
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`[App] Pipeline step failed at ${processId}: ${error.message}`);
        
        // Hata durumunda süreci durdur
        setPipelineStatus(prev => ({
          ...prev,
          [processId]: 'error'
        }));
        
        // Hata mesajını çıktı olarak göster
        setOutput({
          content: `Pipeline Error at ${processId}: ${error.message}`,
          status: 'error',
          processType: 'Pipeline',
          processId: 'pipeline',
          timestamp: new Date().toISOString()
        });
        
        break;
      }
    }
    
    console.log('[App] Pipeline execution completed');
  };
  
  // Ana çalıştırma fonksiyonu - pipeline veya tek süreç
  const handleRun = (processId) => {
    if (!processId) {
      // processId yoksa pipeline çalıştır
      handleStartPipeline();
    } else {
      // processId varsa tek süreç çalıştır
      handleProcessRun(processId);
    }
  };
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        <TabPanel
          processes={processes}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedProcesses={selectedProcesses}
          processOrigins={processOrigins}
          onProcessSelect={handleProcessSelect}
          processFiles={processFiles}
          onFileUpload={handleFileUpload}
          processPrompts={processPrompts}
          onPromptUpdate={handlePromptUpdate}
          pipelineStatus={pipelineStatus}
          onRun={handleRun}
          validationError={validationError}
          output={output}
          isPipelineEnabled={isPipelineEnabled}
          onTogglePipeline={setIsPipelineEnabled}
          managedFiles={managedFiles}
          fileProcessMappings={fileProcessMappings}
          onFileProcessMapping={handleFileProcessMapping}
          onFileDelete={handleFileDelete}
          selectedFileIds={selectedFileIds}
          setSelectedFileIds={setSelectedFileIds}
        />
      </main>
    </div>
  );
}