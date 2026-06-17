import argparse
import os
import sys
import time
import requests


def validate_image_url(url: str) -> bool:
    return url.startswith('http://') or url.startswith('https://')


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Instagram Graph API Test Bot')
    parser.add_argument('--token', dest='access_token', help='Instagram Graph API access token')
    parser.add_argument('--user-id', dest='ig_user_id', help='Instagram Business/User ID')
    parser.add_argument('--image-url', dest='image_url', help='Publicly accessible image URL')
    parser.add_argument('--caption', dest='caption', help='Caption for the post')
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    print('Instagram Graph API Test Bot')
    print('------------------------------------')

    access_token = args.access_token or os.environ.get('IG_ACCESS_TOKEN', '').strip()
    if not access_token:
        print('ERROR: Access token is required.')
        return 1

    ig_user_id = args.ig_user_id or os.environ.get('IG_USER_ID', '').strip()
    if not ig_user_id:
        print('ERROR: IG user ID is required.')
        return 1

    image_url = args.image_url or os.environ.get('IG_IMAGE_URL', 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d').strip()
    if not validate_image_url(image_url):
        print('ERROR: IMAGE_URL must be a valid public HTTP(S) URL.')
        return 1

    caption = args.caption or os.environ.get('IG_CAPTION', 'Testing my brand new standalone AI Instagram Engine! 🤖🚀').strip()

    graph_domain = os.environ.get('IG_GRAPH_DOMAIN', 'https://graph.facebook.com')
    media_create_url = f"{graph_domain}/{ig_user_id}/media"
    media_publish_url = f"{graph_domain}/{ig_user_id}/media_publish"

    print('\n1. Creating Media Container...')
    payload_container = {
        'image_url': image_url,
        'caption': caption,
        'access_token': access_token,
    }

    try:
        res_container = requests.post(media_create_url, data=payload_container, timeout=30).json()
    except requests.RequestException as exc:
        print('❌ Network error while creating container:', exc)
        return 1

    creation_id = res_container.get('id') or res_container.get('creation_id')
    if not creation_id:
        print('❌ Container creation failed:', res_container)
        return 1

    print(f'✅ Container created! ID: {creation_id}')
    print('Waiting 10 seconds for Meta to process the image...')
    time.sleep(10)

    print('\n2. Publishing Media Container...')
    payload_publish = {
        'creation_id': creation_id,
        'access_token': access_token,
    }

    try:
        res_publish = requests.post(media_publish_url, data=payload_publish, timeout=30).json()
    except requests.RequestException as exc:
        print('❌ Network error while publishing container:', exc)
        return 1

    if 'id' in res_publish:
        print(f'🎉 Success! Your post is live on Instagram. Media ID: {res_publish["id"]}')
        return 0

    print('❌ Live publishing failed:', res_publish)
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
