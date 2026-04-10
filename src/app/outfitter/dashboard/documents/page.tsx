'use client';

import { useState } from 'react';
import { uploadOutfitterDocument } from '@/lib/firebase/documentService'; // From Module 10
import { DocumentType } from '@/types/documents'; // From Module 9

// Mocking the existing documents fetch for UI building
const mockExistingDocuments = [
  {
    id: 'doc_1',
    type: 'OUTFITTER_PERMIT',
    fileName: 'Provincial_Permit_2026.pdf',
    status: 'VERIFIED',
    expiryDate: '2026-12-31',
    uploadedAt: '2026-01-15',
  },
  {
    id: 'doc_2',
    type: 'PH_LICENSE',
    fileName: 'PH_License_John.jpg',
    status: 'PENDING',
    expiryDate: '2027-05-20',
    uploadedAt: '2026-03-28',
  }
];

export default function OutfitterDocumentsPage() {
  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>('OUTFITTER_PERMIT');
  const [expiryDate, setExpiryDate] = useState('');
  
  // UI State
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState(mockExistingDocuments);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Hard check on file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("File is too large. Please upload a file smaller than 5MB.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);

    try {
      // In production, fetch this from your auth context
      const currentOutfitterId = "temp_outfitter_123";
      
      const parsedExpiry = expiryDate ? new Date(expiryDate) : null;

      // The LIVE Firebase Service Call
      const result = await uploadOutfitterDocument(file, currentOutfitterId, docType, parsedExpiry);

      if (result.success) {
        alert("Document securely uploaded and sent for Admin review.");
        
        // Optimistically update the UI table
        const newDoc = {
          id: result.documentId || 'temp_id',
          type: docType,
          fileName: file.name,
          status: 'PENDING',
          expiryDate: expiryDate || 'N/A',
          uploadedAt: new Date().toISOString().split('T')[0],
        };
        
        setDocuments([newDoc, ...documents]);
        
        // Reset form
        setFile(null);
        setExpiryDate('');
        
        // Reset the actual file input element
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
      } else {
        alert("Upload failed: " + result.error);
      }
    } catch (error) {
      console.error("Error during upload:", error);
      alert("An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      
      <div className="mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-white">Documents Vault</h1>
        <p className="text-gray-400 mt-1">
          Upload your legal operating permits here. Only-Hunts requires a verified Outfitter Permit to list your hunts publicly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Upload Form Section */}
        <div className="lg:col-span-1">
          <form onSubmit={handleUpload} className="rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-orange-500">Secure Upload</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Document Type</label>
                <select 
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full rounded-lg bg-gray-800 p-3 text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  <option value="OUTFITTER_PERMIT">Provincial Outfitter Permit</option>
                  <option value="PH_LICENSE">Professional Hunter (PH) License</option>
                  <option value="LIABILITY_DISCLAIMER">Signed Liability Disclaimer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Expiry Date (If applicable)</label>
                <input 
                  type="date" 
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required={docType !== 'LIABILITY_DISCLAIMER'}
                  className="w-full rounded-lg bg-gray-800 p-3 text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Select File (PDF, JPG, PNG)</label>
                <input 
                  id="file-upload"
                  type="file" 
                  accept=".pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-400 file:mr-4 file:rounded-full file:border-0 file:bg-orange-500/10 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-orange-500 hover:file:bg-orange-500/20"
                />
              </div>

              <button 
                type="submit" 
                disabled={!file || isUploading}
                className="mt-4 w-full rounded-lg bg-orange-600 py-3 font-bold text-white transition-all hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
              >
                {isUploading ? "Encrypting & Uploading..." : "Upload Document"}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Documents Table Section */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-lg overflow-hidden">
            <div className="border-b border-gray-700 bg-gray-900 p-4">
              <h2 className="text-xl font-semibold text-white">Your Uploaded Documents</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-800 text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="p-4 font-medium">File Name</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Expiry</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        No documents uploaded yet.
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="p-4 truncate max-w-[150px]" title={doc.fileName}>
                          {doc.fileName}
                        </td>
                        <td className="p-4">
                          {doc.type.replace(/_/g, ' ')}
                        </td>
                        <td className="p-4">{doc.expiryDate}</td>
                        <td className="p-4">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                            doc.status === 'VERIFIED' ? 'bg-green-500/20 text-green-400' : 
                            doc.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}