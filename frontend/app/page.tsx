'use client';

import React, { useState } from 'react';
import { Upload, Sun, Moon, Layers, Box, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import ThreeScene from '@/components/ThreeScene';

// Define the shape of data returned from the OpenCV / Tesseract API
interface Room {
  label: string;
  dimensions: string;
  confidence: number;
}

export default function Home() {
  // Application Global States
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Theme Toggler
  const toggleTheme = () => setDarkMode(!darkMode);

  // Drag & Drop Event Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      validateAndProcessFile(droppedFiles[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  // Validate that the image file type conforms to Layout3D specifications
  const validateAndProcessFile = (selectedFile: File) => {
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(selectedFile.type)) {
      setError('Invalid file format. Layout3D only accepts PNG or JPEG blueprint configurations.');
      return;
    }
    setFile(selectedFile);
    uploadAndAnalyze(selectedFile);
  };

  // Multipart HTTP Stream Upload Request targeting the FastAPI Service
  const uploadAndAnalyze = async (targetFile: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', targetFile);

      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process blueprint structural metrics.');
      }

      const data = await response.json();
      setRooms(data.rooms);
    } catch (err: any) {
      setError(err.message || 'Network exception connecting to Layout3D CV service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300">
        
        {/* BRANDING HEADER BAR */}
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
              <Box className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Layout3D
            </span>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        {/* WORKSPACE LAYOUT CONTAINER */}
        <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-80px)]">
          
          {/* LEFT SIDEBAR: MANAGE INPUT CONTROLS */}
          <section className="lg:col-span-4 flex flex-col space-y-6">
            
            {/* FILE UPLOADER WIDGET */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" /> Upload Blueprint
              </h2>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input 
                  type="file" 
                  id="file-select" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileSelect}
                  accept=".png,.jpg,.jpeg"
                />
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium mb-1">Drag and drop blueprint drawing here</p>
                <p className="text-xs text-slate-400">Supports high-res PNG, JPG or JPEG blueprints</p>
              </div>

              {/* LIVE FILE VALIDATION FEEDBACK */}
              {file && !error && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/50 rounded-xl text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="truncate font-medium">{file.name}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950/50 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium text-xs leading-relaxed">{error}</span>
                </div>
              )}
            </div>

            {/* EXTRACTED GEOMETRIC COMPONENT LIST */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col overflow-hidden">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                Parsed Room Structures
              </h2>
              
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                  <p className="text-sm">Running matrix CV transforms...</p>
                </div>
              ) : rooms.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {rooms.map((room, idx) => (
                    <div 
                      key={idx}
                      className="p-4 border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl flex justify-between items-center hover:border-slate-200 dark:hover:border-slate-800 transition-colors"
                    >
                      <div>
                        <h4 className="font-semibold text-sm tracking-tight">{room.label}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{room.dimensions}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-md font-mono bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                        {(room.confidence * 100).toFixed(0)}% match
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-4">
                  <p className="text-sm">No structural items mapped yet.</p>
                  <p className="text-xs text-slate-400/80 mt-1 max-w-[240px]">Drop an architectural image asset layout file above to parse geometry bounds.</p>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT VIEWPORT PANEL: INTERACTIVE CANVAS CONTAINER */}
          <section className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[600px] lg:h-auto min-h-[450px] relative">
            <div className="absolute top-4 left-4 z-10 bg-slate-950/70 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              WebGL Scene Active
            </div>
            
            {/* Inject live interactive Three.js component loop mapping real-time data adjustments */}
            <div className="flex-1 w-full h-full flex flex-col">
              <ThreeScene rooms={rooms} darkMode={darkMode} />
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}