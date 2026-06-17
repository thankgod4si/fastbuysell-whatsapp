# Instagram Graph API Test Bot

This repository includes `ig_test_bot.py`, a small script for testing Instagram Graph API media creation and publishing.

## Setup

1. Install Python dependencies:

```bash
pip install requests
```

2. Set environment variables or provide values when prompted:

- `IG_ACCESS_TOKEN` — your Instagram Graph API access token
- `IG_USER_ID` — your Instagram Business/User ID
- `IG_IMAGE_URL` — a publicly accessible image URL
- `IG_CAPTION` — caption text for the post

Example (PowerShell):

```powershell
$env:IG_ACCESS_TOKEN = 'EAAUqoNdf5SoBRhpRQfvER...'
$env:IG_USER_ID = '17841473985923367'
$env:IG_IMAGE_URL = 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d'
$env:IG_CAPTION = 'Testing my brand new standalone AI Instagram Engine! 🤖🚀'
python .\ig_test_bot.py
```

## Usage

Run the script:

```bash
python ig_test_bot.py
```

The script will:

1. Create an Instagram media container
2. Wait 10 seconds for processing
3. Publish the container live to your Instagram grid

## Notes

- The image URL must be publicly accessible via HTTP(S).
- Do not store your access token in source control.
- If you want, I can also help you wire this into a secure `.env` workflow.
