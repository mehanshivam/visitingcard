import React from 'react';
import { useScanWorkflow } from '../../hooks/useScanWorkflow';

export const ResultsStep: React.FC = () => {
  const { 
    capturedImage, 
    extractedData, 
    resetWorkflow,
    getStepTitle,
    getStepDescription
  } = useScanWorkflow();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {getStepTitle('results')}
        </h2>
        <p className="text-blue-200">
          {getStepDescription('results')}
        </p>
      </div>

      {/* Success Message */}
      <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-green-300 font-semibold">Scan Complete!</h3>
            <p className="text-green-200 text-sm">Successfully extracted contact information</p>
          </div>
        </div>
      </div>

      {/* Results Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Captured Image */}
        {capturedImage && (
          <div className="bg-black/20 rounded-xl p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Original Image
            </h3>
            <img
              src={URL.createObjectURL(capturedImage)}
              alt="Captured business card"
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Extracted Data */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Contact Information
          </h3>
          
          <div className="space-y-4">
            <ContactField 
              label="Name" 
              value={extractedData?.name} 
              icon="👤"
            />
            <ContactField 
              label="Job Title" 
              value={extractedData?.title} 
              icon="💼"
            />
            <ContactField 
              label="Company" 
              value={extractedData?.company} 
              icon="🏢"
            />
            <ContactField 
              label="Phone" 
              value={extractedData?.phone} 
              icon="📞"
            />
            <ContactField 
              label="Email" 
              value={extractedData?.email} 
              icon="📧"
            />
            <ContactField 
              label="Website" 
              value={extractedData?.website} 
              icon="🌐"
            />
            <ContactField 
              label="Address" 
              value={extractedData?.address?.full || extractedData?.address?.street} 
              icon="📍"
            />
          </div>

          {/* Edit Button */}
          <button className="w-full mt-4 px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Contact Information
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          onClick={resetWorkflow}
          className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Scan Another Card
        </button>
        
        <button className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save Contact
        </button>
      </div>

      {/* Export Options */}
      <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
        <h4 className="text-purple-300 font-medium mb-3">Export Options</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ExportButton icon="📱" label="Contacts App" />
          <ExportButton icon="📄" label="vCard" />
          <ExportButton icon="📊" label="CSV" />
          <ExportButton icon="📋" label="Copy Text" />
        </div>
      </div>
    </div>
  );
};

interface ContactFieldProps {
  label: string;
  value?: string;
  icon: string;
}

const ContactField: React.FC<ContactFieldProps> = ({ label, value, icon }) => {
  return (
    <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
      <div className="text-lg">{icon}</div>
      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-white/80 mb-1">
          {label}
        </label>
        <div className="text-white">
          {value ? (
            <span>{value}</span>
          ) : (
            <span className="text-white/40 italic">Not detected</span>
          )}
        </div>
      </div>
    </div>
  );
};

interface ExportButtonProps {
  icon: string;
  label: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ icon, label }) => {
  return (
    <button className="flex flex-col items-center p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
      <div className="text-lg mb-1">{icon}</div>
      <span className="text-xs text-white/80">{label}</span>
    </button>
  );
};