⚙️ 1. Set Up Google Cloud
Step 1: Enable Drive API
Go to → Google Cloud Console → APIs & Services → Library → Google Drive API → Enable
Step 2: Create a Service Account
Navigate to
IAM & Admin → Service Accounts → Create Service Account
Give it a name (e.g. drive-folder-share-bot)
Assign role → “Editor”
After creation, click the account → Keys → Add Key → JSON
Download the JSON — save it as service-account.json in your backend.
Step 3: Share your folder manually once
Open your Google Drive folder (the one you want your app to manage)
Click Share
Add the service account email (it ends with @<project-id>.iam.gserviceaccount.com)
Give it Editor permission.
✅ Now your backend can manage sharing that folder’s permissions.

