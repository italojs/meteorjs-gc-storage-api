import React, { useState, useRef } from 'react';
import { Meteor } from 'meteor/meteor';

export const App = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const testGoogleStorage = () => {
    console.log('Calling googleStorage.signFile method');
    Meteor.call('googleStorage.signFile', 'example-file.txt', (error, result) => {
      if (error) {
        console.error('Error calling method:', error);
        setError(error.message);
      } else {
        console.log('Result:', result);
        setUploadResult(result);
      }
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadResult(null);

    // Read the file as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      
      // Call the upload method
      Meteor.call(
        'googleStorage.uploadFile',
        base64Data,
        file.name,
        file.type,
        (error, result) => {
          setUploading(false);
          if (error) {
            console.error('Error uploading:', error);
            setError(error.message);
          } else {
            console.log('Upload successful:', result);
            setUploadResult(result);
          }
        }
      );
    };
    
    reader.onerror = (e) => {
      setUploading(false);
      setError('Error reading file');
      console.error('Error reading file:', e);
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div>      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Google Cloud Storage Test</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>1. Test Signed URL</h3>
          <button onClick={testGoogleStorage}>
            Test Signed URL
          </button>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>2. Upload File</h3>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ marginBottom: '10px' }}
          />
          <div>
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Select and Upload File'}
            </button>
          </div>
        </div>
        
        {error && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {uploadResult && (
          <div style={{ marginTop: '10px' }}>
            <h3>Result:</h3>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
              {JSON.stringify(uploadResult, null, 2)}
            </pre>
            {uploadResult.signedUrl && (
              <div style={{ marginTop: '10px' }}>
                <a href={uploadResult.signedUrl} target="_blank" rel="noopener noreferrer">
                  Open file
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
