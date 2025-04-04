/**
 * 디바이스 타입 감지 유틸리티
 */

/**
 * 현재 환경이 모바일 기기인지 확인
 * @returns {boolean} 모바일 기기인 경우 true, 그렇지 않으면 false
 */
export function isMobileDevice(): boolean {
  // navigator.userAgent가 정의되어 있는지 확인 (서버 사이드 렌더링시 undefined)
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return false;
  }
  
  // 일반적인 모바일 기기 감지 - userAgent 패턴으로 확인
  const regex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return regex.test(navigator.userAgent);
}

/**
 * 현재 환경이 iOS 기기인지 확인
 * @returns {boolean} iOS 기기인 경우 true, 그렇지 않으면 false
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return false;
  }
  
  // iOS 디바이스 감지
  const regex = /iPhone|iPad|iPod/i;
  return regex.test(navigator.userAgent);
}

/**
 * 현재 환경이 안드로이드 기기인지 확인
 * @returns {boolean} 안드로이드 기기인 경우 true, 그렇지 않으면 false
 */
export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return false;
  }
  
  // 안드로이드 디바이스 감지
  return /Android/i.test(navigator.userAgent);
} 