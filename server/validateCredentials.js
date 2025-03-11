import { Meteor } from 'meteor/meteor';
import fs from 'fs';

Meteor.startup(() => {
  // Get the credentials file path from settings.json
  const GCS_CONFIG = Meteor.settings.googleCloudStorage || {};
  const keyFilename = GCS_CONFIG.keyFilename;
  
  if (!keyFilename) {
    console.error('ERROR: Credentials file path not configured in settings.json');
    return;
  }
  
  console.log('Validating credentials file:', keyFilename);
  
  try {
    // Check if the file exists
    if (!fs.existsSync(keyFilename)) {
      console.error(`ERROR: Credentials file not found at ${keyFilename}`);
      return;
    }
    
    // Check file permissions
    try {
      const stats = fs.statSync(keyFilename);
      const filePermissions = stats.mode.toString(8).slice(-3);
      console.log(`File permissions: ${filePermissions}`);
      
      // Check if the file has read permission for the current user
      const canRead = (stats.mode & fs.constants.R_OK) !== 0;
      console.log(`File can be read by current user: ${canRead ? 'Yes' : 'No'}`);
      
      if (!canRead) {
        console.error('ERROR: The credentials file does not have read permission for the current user');
        console.log('Try running: chmod 600 ' + keyFilename);
      }
    } catch (statError) {
      console.error('ERROR checking file permissions:', statError.message);
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(keyFilename, 'utf8');
    
    // Try to parse the JSON
    try {
      const credentials = JSON.parse(fileContent);
      
      // Check required fields
      const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
      const missingFields = requiredFields.filter(field => !credentials[field]);
      
      if (missingFields.length > 0) {
        console.error('ERROR: Credentials file is missing required fields:', missingFields.join(', '));
      } else {
        console.log('Credentials file is valid and contains all required fields');
        console.log('- type:', credentials.type);
        console.log('- project_id:', credentials.project_id);
        console.log('- client_email:', credentials.client_email);
      }
    } catch (parseError) {
      console.error('ERROR: Credentials file is not a valid JSON:', parseError.message);
    }
  } catch (error) {
    console.error('ERROR validating credentials file:', error.message);
  }
}); 