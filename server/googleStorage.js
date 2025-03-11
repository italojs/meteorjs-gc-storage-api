import { Meteor } from 'meteor/meteor';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';

// Google Cloud Storage Settings
const GCS_CONFIG = Meteor.settings.googleCloudStorage || {};
const GCS_PROJECT_ID = GCS_CONFIG.projectId || process.env.GCS_PROJECT_ID;
const GCS_KEY_FILENAME = GCS_CONFIG.keyFilename || process.env.GCS_KEY_FILENAME;
const GCS_BUCKET_NAME = GCS_CONFIG.bucketName || process.env.GCS_BUCKET_NAME || 'example-bucket123';

// Configure the GOOGLE_APPLICATION_CREDENTIALS environment variable if the credentials file is defined
if (GCS_KEY_FILENAME && fs.existsSync(GCS_KEY_FILENAME)) {
  console.log(`Setting GOOGLE_APPLICATION_CREDENTIALS to ${GCS_KEY_FILENAME}`);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = GCS_KEY_FILENAME;
}

// Try to load credentials directly from the file
let credentials = null;
if (GCS_KEY_FILENAME && fs.existsSync(GCS_KEY_FILENAME)) {
  try {
    const fileContent = fs.readFileSync(GCS_KEY_FILENAME, 'utf8');
    credentials = JSON.parse(fileContent);
    console.log('Credentials loaded directly from file');
  } catch (error) {
    console.error('Error loading credentials from file:', error.message);
  }
}

// Function to create a Storage instance
function createStorageInstance() {
  // Storage configuration based on environment variables or settings.json
  const storageConfig = {};
  
  // Add configurations only if they are defined
  if (GCS_PROJECT_ID) storageConfig.projectId = GCS_PROJECT_ID;
  
  // Method 1: Use the file path
  if (GCS_KEY_FILENAME) storageConfig.keyFilename = GCS_KEY_FILENAME;
  
  // Method 2: Use the credentials loaded directly
  if (credentials) storageConfig.credentials = credentials;
  
  // Create the Storage instance with the available configurations
  return new Storage(storageConfig);
}

// Check and create the bucket if necessary
Meteor.startup(async () => {
  try {
    console.log(`Checking if bucket ${GCS_BUCKET_NAME} exists...`);
    const storage = createStorageInstance();
    const bucket = storage.bucket(GCS_BUCKET_NAME);
    
    const [exists] = await bucket.exists();
    if (!exists) {
      console.log(`Bucket ${GCS_BUCKET_NAME} does not exist. Trying to create...`);
      
      try {
        const [newBucket] = await storage.createBucket(GCS_BUCKET_NAME, {
          location: 'us-central1',
          storageClass: 'STANDARD',
          // Make the bucket public (optional)
          // publicAccessPrevention: 'inherited'
        });
        
        console.log(`Bucket ${GCS_BUCKET_NAME} created successfully!`);
        
        // Configure permissions to make objects public (optional)
        // await bucket.makePublic();
        
      } catch (createError) {
        console.error(`Error creating bucket ${GCS_BUCKET_NAME}:`, createError.message);
      }
    } else {
      console.log(`Bucket ${GCS_BUCKET_NAME} already exists.`);
    }
  } catch (error) {
    console.error('Error checking/creating bucket:', error.message);
  }
});

Meteor.methods({
  'googleStorage.signFile': async function(fileReference) {
    if (Meteor.isServer) {
      try {
        console.log('Trying to create Storage instance');
        
        // Check if the credentials file exists
        if (GCS_KEY_FILENAME) {
          try {
            const fileExists = fs.existsSync(GCS_KEY_FILENAME);
            console.log('Credentials file exists?', fileExists);
            
            if (fileExists) {
              // Check if the file can be read
              try {
                const fileContent = fs.readFileSync(GCS_KEY_FILENAME, 'utf8');
                const jsonContent = JSON.parse(fileContent);
                console.log('Credentials file is a valid JSON with keys');
              } catch (readError) {
                console.error('Error reading credentials file:', readError.message);
              }
            }
          } catch (fsError) {
            console.error('Error checking credentials file:', fsError.message);
          }
        }
        
        const storage = createStorageInstance();
        
        const options = {
          version: 'v4',
          action: 'read',
          expires: Date.now() + 180 * 60 * 1000, // 180 minutes
        };
        
        console.log(`Trying to get signed URL for file ${fileReference} in bucket ${GCS_BUCKET_NAME}`);
        const [url] = await storage.bucket(GCS_BUCKET_NAME).file(fileReference).getSignedUrl(options);
        
        return {
          success: true,
          url,
          expiresAt: new Date(options.expires)
        };
      } catch (error) {
        console.error('Error signing file:', error);
        throw new Meteor.Error('google-storage-error', error.message);
      }
    }
  },
  
  // New method for uploading files
  'googleStorage.uploadFile': async function(fileData, fileName, contentType) {
    if (Meteor.isServer) {
      try {
        console.log(`Starting upload of file ${fileName} to bucket ${GCS_BUCKET_NAME}`);
        
        // Create Storage instance
        const storage = createStorageInstance();
        
        // Reference to the bucket
        const bucket = storage.bucket(GCS_BUCKET_NAME);
        
        // Check if the bucket exists
        const [bucketExists] = await bucket.exists();
        if (!bucketExists) {
          console.error(`Bucket ${GCS_BUCKET_NAME} does not exist`);
          throw new Meteor.Error('bucket-not-found', `Bucket ${GCS_BUCKET_NAME} does not exist`);
        }
        
        // Create file in the bucket
        const file = bucket.file(fileName);
        
        // Convert base64 data to buffer (if necessary)
        let buffer;
        if (fileData.startsWith('data:')) {
          // Format: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...
          const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            buffer = Buffer.from(matches[2], 'base64');
          } else {
            throw new Meteor.Error('invalid-data', 'Invalid data format');
          }
        } else {
          // Assuming it's a direct base64 string
          buffer = Buffer.from(fileData, 'base64');
        }
        
        // Configure upload options
        const options = {
          metadata: {
            contentType: contentType || 'application/octet-stream'
          }
        };
        
        // Upload the file
        await file.save(buffer, options);
        
        console.log(`File ${fileName} uploaded successfully to bucket ${GCS_BUCKET_NAME}`);
        
        // Generate public URL (if the bucket is public)
        const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${fileName}`;
        
        // Generate signed URL (for temporary access)
        const signedUrlOptions = {
          version: 'v4',
          action: 'read',
          expires: Date.now() + 180 * 60 * 1000, // 180 minutes
        };
        
        const [signedUrl] = await file.getSignedUrl(signedUrlOptions);
        
        return {
          success: true,
          fileName,
          publicUrl,
          signedUrl,
          expiresAt: new Date(signedUrlOptions.expires)
        };
      } catch (error) {
        console.error('Error uploading file:', error);
        throw new Meteor.Error('upload-error', error.message);
      }
    }
  }
}); 