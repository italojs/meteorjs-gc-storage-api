# Google Cloud Storage Integration with Meteor

This project demonstrates how to integrate Google Cloud Storage with a Meteor application, allowing you to upload files and generate signed URLs for secure access.

## Features

- Authentication with Google Cloud Storage
- File upload to Google Cloud Storage
- Generation of signed URLs for temporary access to files
- Automatic bucket creation if it doesn't exist
- Validation of Google Cloud credentials

## Prerequisites

- [Meteor](https://www.meteor.com/install) (version 3.0+)
- [Node.js](https://nodejs.org/) (version 14+)
- A Google Cloud Platform account with the Cloud Storage API enabled
- A service account with appropriate permissions

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd <repository-directory>
```

2. Install dependencies:
```bash
meteor npm install
```

## Configuration

### Google Cloud Platform Setup

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Cloud Storage API
3. Create a service account with the following roles:
   - Storage Admin (for full access)
   - Or more specific roles like Storage Object Creator and Storage Object Viewer
4. Create and download a JSON key file for the service account

### Application Configuration

1. Create or edit the `settings.json` file in the project root:
```json
{
  "googleCloudStorage": {
    "projectId": "your-project-id",
    "keyFilename": "/absolute/path/to/your-credentials-file.json",
    "bucketName": "your-bucket-name"
  }
}
```

Replace:
- `your-project-id` with your Google Cloud project ID
- `/absolute/path/to/your-credentials-file.json` with the absolute path to your service account key file
- `your-bucket-name` with your desired bucket name (will be created if it doesn't exist)

## Running the Application

Start the application with the settings file:

```bash
meteor run --settings settings.json
```

The application will be available at http://localhost:3000

## Project Structure

```
.
├── client/                 # Client-side code
├── imports/                # Modules used by both client and server
│   └── ui/                 # React components
│       └── App.jsx         # Main application component
├── server/                 # Server-side code
│   ├── googleStorage.js    # Google Cloud Storage integration
│   ├── validateCredentials.js # Credentials validation
│   └── main.js             # Server entry point
├── public/                 # Public assets
├── .meteor/                # Meteor configuration
├── package.json            # Project dependencies
├── settings.json           # Application settings
└── README.md               # This file
```

## Usage

The application provides a simple interface with two main functions:

1. **Test Signed URL**: Tests the generation of a signed URL for a file named "example-file.txt"
2. **Upload File**: Allows you to select and upload a file to Google Cloud Storage

After uploading a file, you'll receive:
- A public URL (if the bucket is public)
- A signed URL for temporary access
- Expiration time for the signed URL

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

1. Verify that the path to your credentials file in `settings.json` is correct and absolute
2. Check that the service account has the necessary permissions
3. Ensure the credentials file has read permissions: `chmod 600 /path/to/credentials.json`

### Bucket Issues

If you have issues with the bucket:

1. Check if the bucket name is globally unique
2. Verify that your service account has permission to create buckets (if it doesn't exist)
3. Check the server logs for specific error messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Meteor](https://www.meteor.com/) - The web framework used
- [Google Cloud Storage](https://cloud.google.com/storage) - Cloud storage service
- [@google-cloud/storage](https://www.npmjs.com/package/@google-cloud/storage) - Node.js client library for Google Cloud Storage 