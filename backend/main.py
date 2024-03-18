import base64
from fastapi import FastAPI, UploadFile, Form, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid

from PIL import Image
from PIL.ExifTags import TAGS
import numpy as np
import cv2

app = FastAPI()

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def image_edit(photog, image, filename):
    meta_data_list = ['Model', 'ExposureTime', 'ISOSpeedRatings', 'FNumber']
    meta_data = {}

    img_sample = Image.open(image)

    img_info = img_sample._getexif()
    for tag_id in img_info:
        tag = TAGS.get(tag_id, tag_id)
        data = img_info.get(tag_id)
        if tag in meta_data_list:
            meta_data[tag] = data
    img_sample.close()

    if meta_data == {}:
        return 'fail'
    else:
        img = cv2.imread(image)

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

        # 메타 데이터 추가
        font = cv2.FONT_HERSHEY_DUPLEX

        meta_data_text = f'{meta_data["Model"]}   F{meta_data["FNumber"]}   1/{1 / meta_data["ExposureTime"]}   ISO {meta_data["ISOSpeedRatings"]}'
        meta_data_textsize = cv2.getTextSize(meta_data_text, font, 0.9, 1)[0]
        meta_data_textX = (1080 - meta_data_textsize[0]) // 2
        meta_data_h = y + n_h + 50

        photog = f'Photo by @{photog}'
        photog_textsize = cv2.getTextSize(photog, font, 0.9, 2)[0]
        photog_textX = (1080 - photog_textsize[0]) // 2
        photog_h = y + n_h + 130

        # 텍스트 추가
        cv2.putText(white_background, meta_data_text, (meta_data_textX, meta_data_h), font, 0.9, (0, 0, 0), 1,
                    cv2.LINE_AA)
        cv2.putText(white_background, photog, (photog_textX, photog_h), font, 0.9, (0, 0, 0), 1, cv2.LINE_AA)
        cv2.imwrite(f'./photo/frame_{filename}', white_background)

        return 'success'


def DeleteFile(UPLOAD_DIR: str, filename: str):
    os.remove(UPLOAD_DIR + '/' + filename)
    os.remove(UPLOAD_DIR + '/' + 'frame_' + filename)


@app.post('/image')
async def post_image(InstaID: str = Form(...), image: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    UPLOAD_DIR = "./photo"
    content = image.file.read()
    filename = f"{str(uuid.uuid4())}.jpg"

    with open(os.path.join(UPLOAD_DIR, filename), "wb") as fp:
        fp.write(content)

    status = image_edit(InstaID, os.path.join(UPLOAD_DIR, filename), filename)
    if status == 'success':
        background_tasks.add_task(DeleteFile, UPLOAD_DIR, filename)
        with open(os.path.join(UPLOAD_DIR, 'frame_' + filename), 'rb') as f:
            base64image = base64.b64encode(f.read())
        return {
            "status": "success",
            "base64": base64image
        }
    else:
        return {"status": "fail"}
