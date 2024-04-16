"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { useState, useRef } from "react";
import blank from '../../public/blank.jpg';
import { FaGithubSquare } from "react-icons/fa";

export default function Home() {
  const [image, setImage] = useState(blank);
  const [InstaName, SetInstaName] = useState('');
  const [IsImgSeleected, SetImgSelected] = useState(false);
  const [ShowDownloadBtn, SetShowDownloadBtn] = useState(false);
  const [file, Setfile] = useState();
  const [IsLoading, SetLoading] = useState(false);

  const fileInput = useRef(null);

  const handleImage = async (file) => {
    if (InstaName == '') {
      alert('인스타 ID를 입력하세요.');
    } else {
      const formData = new FormData();
      formData.append('InstaID', InstaName);
      formData.append('image', file);

      try {
        SetLoading(true);
        await fetch('https://photoframe.onrender.com/image', {
          method: 'POST',
          body: formData,
        })
          .then(res => res.json())
          .then(res => {
            if (res['status'] == "fail") {
              alert('메타 데이터를 찾지 못했습니다. 다른 사진으로 다시 시도해주세요.');
            } else if (res['status'] == "success") {
              setImage(`data:image/jpeg;base64,${res['base64']}`);
              SetShowDownloadBtn(true);
            }
          })
      } catch (error) {
        console.log(error);
      } finally {
        SetLoading(false);
      }
    }
  }

  const DownloadImage = () => {
    const a = document.createElement("a");
    a.href = image;
    a.download = "download";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const onChange = (e) => {
    SetInstaName(e.target.value);
  }

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <div className={styles.InstallDiv}>
          <h3>앱 설치 방법 (모바일)</h3>
          <p>아이폰: 사파리 접속 -&gt; 공유 아이콘 클릭 -&gt; 홈 화면에 추가</p>
          <p>안드로이드: 크롬 접속 -&gt; 브라우저 우측 메뉴 -&gt; 앱 설치</p>
          <br />
          <div className={styles.Copyright}>
            <span>Copyright © 2024 이석민. All rights Reserved.</span>
            <a href="https://github.com/seokmin12/PhotoFrame" target="_blank"><FaGithubSquare size={16} /></a>
          </div>
        </div>
        <div className={styles.ImageContainer}
          onClick={() => fileInput.current.click()}
        >
          <Image
            className={styles.img}
            src={image}
            alt="preview"
            layout="responsive"
            priority
            width={500}
            height={500}
          />
        </div>
        <input className={styles.InstaNameInput} onChange={onChange} value={InstaName} placeholder="Instragram ID" />
        {IsImgSeleected && (
          ShowDownloadBtn ?
            <div className={styles.DownloadDiv}>
              <button className={styles.DownloadBtn} onClick={DownloadImage}>다운로드</button>
              <button className={styles.ReloadBtn} onClick={() => window.location.reload()}>다시 시도</button>
            </div>
            :
            <button className={styles.UploadBtn} onClick={() => handleImage(file)}>
              {
                IsLoading ?
                  <p>Loading...</p>
                  : <p>업로드</p>
              }
            </button>
        )}
        <div className={styles.filebox}>
          <input
            type="file"
            className={styles.file}
            id="file"
            ref={fileInput}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                Setfile(file);
                URL.revokeObjectURL(image);
                setImage((_pre) => URL.createObjectURL(file));
                SetImgSelected(true);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
