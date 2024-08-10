import { DataStorage } from "./DataStorage";

export class GoogleDriveStorage extends DataStorage {
    private gapi;  // Google API client instance
    private userFolderId; // ID of the user's folder on Drive

    public constructor() {
        super("GoogleDriveStorage");
        // Load Google's API client and Drive API
        this.loadGapiAndDrive();
    }

    private loadGapiAndDrive() {
        // Load the Google APIs Client Library and Drive API
        // You'd typically use a <script> tag in your HTML to load the library

        // Make sure to initialize gapi after it's loaded, and then authenticate the user
        // gapi.load()...

        // Once loaded and authenticated, you can set up the Drive API instance:
        // this.gapi = gapi.client.drive;
    }

    private async getOrCreateUserFolder() {
        const folderName = "YourAppDataStorage"; // Choose a unique name for your app's folder in user's Drive

        // Search for the folder
        const response = await this.gapi.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
            spaces: 'drive',
            fields: 'files(id, name)'
        });

        if (response.result.files && response.result.files.length) {
            this.userFolderId = response.result.files[0].id;
        } else {
            // Folder doesn't exist, create it
            const folderMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            };

            const createdFolder = await this.gapi.files.create({
                resource: folderMetadata,
                fields: 'id'
            });
            
            this.userFolderId = createdFolder.result.id;
        }
    }

    public async hasValue(key: string) {
        const response = await this.gapi.files.list({
            q: `name='${key}' and '${this.userFolderId}' in parents`,
            spaces: 'drive',
            fields: 'files(id, name)'
        });

        return !!response.result.files && response.result.files.length > 0;
    }

    public async getValue(key: string) {
        const response = await this.gapi.files.list({
            q: `name='${key}' and '${this.userFolderId}' in parents`,
            spaces: 'drive',
            fields: 'files(id, name, webContentLink)'
        });

        if (response.result.files && response.result.files.length) {
            // Assuming file content is stored as media, download file content
            const fileContent = await fetch(response.result.files[0].webContentLink);
            return await fileContent.text();
        }

        return null; // Or throw an error if you prefer
    }

    public async setValue(key: string, value: string) {
        if (await this.hasValue(key)) {
            // If file exists, update it
            const file = await this.gapi.files.update({
                fileId: key,
                uploadType: 'media',
                media: {
                    mimeType: 'text/plain',
                    body: value
                }
            });
            return true;
        } else {
            // Else, create a new file
            const fileMetadata = {
                name: key,
                parents: [this.userFolderId]
            };

            const file = await this.gapi.files.create({
                resource: fileMetadata,
                media: {
                    mimeType: 'text/plain',
                    body: value
                },
                fields: 'id'
            });
            return false;
        }
    }

    public async deleteValue(key: string): Promise<boolean> {
        // TODO
        return false;    
    }

    public async getQuota(): Promise<number> {
        // TODO
        return 0;
    }
}
