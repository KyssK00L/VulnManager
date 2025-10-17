# VulnManager Word Macro

This directory contains the VBA code for the Word macro that integrates with VulnManager API.

## Files

- `Settings.bas` - Configuration and settings management
- `Api.bas` - API communication functions
- `Cache.bas` - Local cache management using CustomXMLParts
- `Insert.bas` - Insert vulnerability cartouche into document
- `VulnForm.frm` - Main UserForm for searching and selecting vulnerabilities
- `VBA-JSON.bas` - JSON parser for VBA (external library)

## Installation

1. Open Microsoft Word
2. Press `Alt+F11` to open the VBA Editor
3. Go to File > Import File
4. Import each `.bas` file in this directory
5. Import the `VulnForm.frm` file
6. Close the VBA Editor
7. Save the document as a macro-enabled template (`.dotm`)

## Configuration

Before using the macro, you need to configure:

1. **API Base URL**: Set the URL of your VulnManager API
2. **API Token**: Get a token from an admin user in the web interface

### Setting up the token

1. Log in to VulnManager web interface as admin
2. Go to "API Tokens" page
3. Click "Create Token"
4. Set a label (e.g., "My Word Macro")
5. Select scopes: `read:vulns` and `export:doc`
6. Click "Create"
7. **Copy the token immediately** (you won't see it again!)
8. In Word, run the VulnManager settings form
9. Paste the API URL and token
10. Click "Save"

## Usage

1. Open a Word document based on this template
2. Run the VulnManager UserForm (via ribbon button or Alt+F8)
3. The macro will sync vulnerabilities from the API
4. Search and filter vulnerabilities
5. Select a vulnerability to preview it
6. Click "Insert" to add it to your document

## Security Notes

- The API token is stored in the document's Variables collection
- Never share the token or the document with the token
- If the token is compromised, revoke it immediately in the web interface
- Tokens can be rotated without changing configuration

## Customization

You can customize:

- The cartouche format in `Insert.bas`
- The UserForm layout in `VulnForm.frm`
- Cache refresh interval in `Cache.bas`
- API endpoints in `Api.bas`
