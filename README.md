이 웹사이트는 [Next.js](https://nextjs.org/)를 사용해 만들어졌습니다.

## 이 사이트를 만든 목적

인스타그램에 자신이 찍은 사진을 올릴 때, 원본 그대로 올리는 것 보다 그 사진의 [EXIF](https://namu.wiki/w/EXIF)(셔터 스피드, 조리개 값, ISO등)를 입력해 놓음으로써 사람들이 정보를 알 수 있게 되는 프레임을 만드는 것이 유행이다.  
그러나, 이 작업은 포토샵으로 일일이 입력해야 하다는 것이 단점이었다. 그래서 이 작업을 Python 코드로 자동화하여 사용자에게 제공하면 더욱 편리하겠다는 생각을 하여 만들었다.


## Getting Started

먼저, 로컬 서버에서 다음의 커맨드를 실행한다:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

로컬 주소 [http://localhost:3000](http://localhost:3000)에 접속하여 결과물을 확인한다.

## 주요 Python 코드

```python
meta_data_list = ['Model', 'ExposureTime', 'ISOSpeedRatings', 'FNumber']
meta_data = {}


def get_image_exif(image):
    img = Image.open(image)

    img_info = img._getexif()
    for tag_id in img_info:
        tag = TAGS.get(tag_id, tag_id)
        data = img_info.get(tag_id)
        if tag in meta_data_list:
            meta_data[tag] = data
    img.close()

            ⋮

frame_h, frame_w = 1350, 1080
h, w, c = img.shape
if h > w:  # 세로 사진
    n_w = round(1080 / 1.6)
    x = round((frame_w // 2) - (n_w // 2))
    y = 70
    n_h = round((h / w) * n_w)
else:  # 가로 사진
    n_w = round(1080 / 1.4)
    x = round((frame_w // 2) - (n_w // 2))
    y = 200
    n_h = round((h / w) * n_w)

white_background = np.zeros((frame_h, frame_w, 3), np.uint8)
white_background.fill(255)

new_img = cv2.resize(img, (n_w, n_h))
white_background[y:y + n_h, x:x + n_w, :] = new_img
```

## 로직

```mermaid
flowchart LR
    A(프론트엔드)
    B[사진의 메타 데이터 가져오기]
    C[numpy를 이용하여
    흰 배경 만들기]
    D[원본 사진을 일정한 
    비율에 맞춰 resize하기]
    E[흰 배경에 resize된 사진과
    메타 데이터 입력하기]

    A ---> |사진 전송| B
    subgraph 백엔드
    B --- C --- D --- E
    end
    E ---> |생성된 이미지를 base64로 
    인코딩하여 return하기| A
```