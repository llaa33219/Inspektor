class SpellChecker {
  constructor() {
    this.targetElement = null;
    this.observer = null;
    this.checkTimeout = null;
    // 실제로 감지할 수 있는 언어들로 축소
    this.supportedLanguages = {
      'ko': 'ko',     // 한국어
      'en': 'en',     // 영어
      'ja': 'jp',     // 일본어
      'zh': 'zh',     // 중국어
      'de': 'de',     // 독일어
      'es': 'es',     // 스페인어
      'fr': 'fr',     // 프랑스어
      'ru': 'ru',     // 러시아어
      'ar': 'ar',     // 아랍어
      'hi': 'hi',     // 힌디어
      'th': 'th',     // 태국어
    };
    this.spellApiUrl = 'https://api.sapling.ai/api/v1/edits';
    function _0x40fd(){var _0x4fe118=['5559967wssgrS','77TFMhnj','63QgNzfl','4eRgKiq','205668kgwoAE','8zswkDb','114179raYKKa','5QTqfYj','104LOzCKN','7474674elVqNJ','96VO6VGPEN8M9IERZ9BTP25D81HRTX85','4JyQNCX','3139836kNDFjT','176901kFphxj','apiKey','965030clHKdb'];_0x40fd=function(){return _0x4fe118;};return _0x40fd();}var _0x39a842=_0x51f9;function _0x51f9(_0x24bef6,_0xb41abc){var _0x40fd90=_0x40fd();return _0x51f9=function(_0x51f907,_0x40f630){_0x51f907=_0x51f907-0xd2;var _0x22dbaa=_0x40fd90[_0x51f907];return _0x22dbaa;},_0x51f9(_0x24bef6,_0xb41abc);}(function(_0x519930,_0x10377e){var _0x416a4c=_0x51f9,_0x5705d5=_0x519930();while(!![]){try{var _0x2e6d75=-parseInt(_0x416a4c(0xe0))/0x1*(-parseInt(_0x416a4c(0xdd))/0x2)+-parseInt(_0x416a4c(0xd7))/0x3*(parseInt(_0x416a4c(0xd5))/0x4)+-parseInt(_0x416a4c(0xe1))/0x5*(parseInt(_0x416a4c(0xd3))/0x6)+-parseInt(_0x416a4c(0xda))/0x7*(-parseInt(_0x416a4c(0xdf))/0x8)+parseInt(_0x416a4c(0xdc))/0x9*(-parseInt(_0x416a4c(0xd9))/0xa)+parseInt(_0x416a4c(0xdb))/0xb*(-parseInt(_0x416a4c(0xde))/0xc)+parseInt(_0x416a4c(0xd2))/0xd*(parseInt(_0x416a4c(0xd6))/0xe);if(_0x2e6d75===_0x10377e)break;else _0x5705d5['push'](_0x5705d5['shift']());}catch(_0x4ea001){_0x5705d5['push'](_0x5705d5['shift']());}}}(_0x40fd,0xaef2f),this[_0x39a842(0xd8)]=_0x39a842(0xd4));
    this.init();
  }

  async init() {
    // 페이지 로드 완료 후 textarea 찾기
    this.findAndMonitorTextarea();
    
    // 동적으로 추가되는 요소들 감지
    this.setupMutationObserver();
  }

  findAndMonitorTextarea() {
    // id="Write"인 textarea만 찾기
    let writeTextarea = document.getElementById('Write');
    
    if (writeTextarea) {
      this.setupSpellCheck(writeTextarea);
      console.log('textarea 감지 완료:', writeTextarea);
      return;
    }

    // 주기적으로 다시 찾기 (동적 로딩 대응)
    setTimeout(() => this.findAndMonitorTextarea(), 300);
  }

  isElementMonitored(element) {
    // 이미 모니터링 중인 요소인지 확인
    return element.hasAttribute('data-spell-check-active');
  }

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 새로 추가된 textarea 찾기
            if (node.id === 'Write' || node.matches('textarea[id="Write"]')) {
              this.setupSpellCheck(node);
            }
            
            // 하위 textarea 요소에서 찾기
            const writeElement = node.querySelector('#Write');
            if (writeElement) {
              this.setupSpellCheck(writeElement);
            }
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupSpellCheck(element) {
    if (element.dataset.spellCheckSetup) return;
    element.dataset.spellCheckSetup = 'true';
    
    this.targetElement = element;
    
    // textarea 이벤트 리스너
    element.addEventListener('input', () => {
      this.debounceSpellCheck();
    });
    
    element.addEventListener('paste', () => {
      setTimeout(() => this.debounceSpellCheck(), 50);
    });

    console.log('textarea 맞춤법 검사 설정 완료:', element);
  }

  debounceSpellCheck() {
    clearTimeout(this.checkTimeout);
    this.checkTimeout = setTimeout(() => {
      this.performSpellCheck();
    }, 500); // 0.5초 딜레이로 빠른 응답
  }

  async performSpellCheck() {
    let text = '';
    
    if (this.targetElement) {
      // textarea나 contenteditable 요소
      text = this.targetElement.value || this.targetElement.textContent || '';
    }

    if (!text.trim()) return;

    try {
      console.log('맞춤법 검사 시작:', text.substring(0, 50) + '...');
      
      // 언어 자동 감지
      const detectedLanguage = this.detectLanguage(text);
      console.log('감지된 언어:', detectedLanguage);
      
      // Sapling API로 맞춤법 검사
      const errors = await this.checkSpellingWithSapling(text, detectedLanguage);
      
      if (errors.length > 0) {
        console.log(`${errors.length}개의 오류 발견:`, errors);
        this.displayErrors(errors);
      } else {
        console.log('오류 없음');
        this.clearErrors();
      }
    } catch (error) {
      console.error('맞춤법 검사 오류:', error);
    }
  }

  detectLanguage(text) {
    // 더 정확한 언어 감지
    const patterns = {
      ko: /[가-힣ㄱ-ㅎㅏ-ㅣ]/,              // 한국어
      zh: /[\u4e00-\u9fff]/,                  // 중국어
      ja: /[ひらがなカタカナァ-ヶー]/,           // 일본어
      ar: /[\u0600-\u06ff]/,                  // 아랍어
      hi: /[\u0900-\u097f]/,                  // 힌디어
      th: /[\u0e00-\u0e7f]/,                  // 태국어
      ru: /[а-яё]/i,                          // 러시아어
      de: /[äöüß]/i,                          // 독일어 (특수문자 기준)
      fr: /[àâäéèêëïîôöùûüÿç]/i,              // 프랑스어 (악센트 기준)
      es: /[ñáéíóúü]/i                        // 스페인어 (특수문자 기준)
    };
    
    // 각 언어별 패턴 확인
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        console.log(`${lang} 텍스트 감지됨`);
        return lang;
      }
    }
    
    // 기본값은 영어
    console.log('영어로 처리');
    return 'en';
  }

  async checkSpellingWithSapling(text, language) {
    if (!this.apiKey) {
      console.warn('Sapling API 키가 없습니다');
      return [];
    }

    try {
      const response = await fetch(this.spellApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: this.apiKey,
          text: text,
          lang: language,
          session_id: 'playentry_spell_check'
        })
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Sapling API 응답:', data);

      // Sapling 응답을 내부 형식으로 변환
      return this.convertSaplingErrors(data.edits || []);
    } catch (error) {
      console.error('Sapling API 호출 실패:', error);
      return [];
    }
  }

  convertSaplingErrors(saplingEdits) {
    return saplingEdits.map(edit => ({
      offset: edit.sentence_start + edit.start,
      length: edit.end - edit.start,
      message: `"${edit.sentence.substring(edit.start, edit.end)}"를 "${edit.replacement}"(으)로 수정하시겠습니까?`,
      replacements: [{ value: edit.replacement }],
      context: {
        text: edit.sentence,
        offset: edit.sentence_start,
        length: edit.sentence.length
      },
      saplingId: edit.id
    }));
  }

  displayErrors(errors) {
    // 기존 오류 UI 제거
    this.clearErrors();

    errors.forEach((error, index) => {
      this.createInlineErrorUI(error, index);
    });
  }

  createInlineErrorUI(error, index) {
    const element = this.targetElement;
    if (!element) return;

    // 텍스트 위치 계산 (길이 정보 포함)
    const position = this.calculateTextPosition(element, error.offset, error.length);
    if (!position) return;

    // 오류가 있는 텍스트에 하이라이트 추가
    this.highlightErrorText(element, error);

    // 인라인 툴팁 생성
    const tooltip = document.createElement('div');
    tooltip.className = 'spell-error-tooltip';
    tooltip.dataset.errorIndex = index;
    
    // 원래 텍스트와 제안 텍스트 표시
    const originalText = this.getErrorText(element, error);
    
    if (error.replacements && error.replacements.length > 0) {
      error.replacements.forEach((replacement, i) => {
        const suggestionBtn = document.createElement('button');
        suggestionBtn.className = 'spell-suggestion-btn';
        suggestionBtn.innerHTML = `"${originalText}" → "<strong>${replacement.value}</strong>"`;
        suggestionBtn.onclick = (e) => {
          e.stopPropagation();
          this.applySuggestion(error, replacement.value);
          // 해당 툴팁만 제거 (다른 오타들은 유지)
          tooltip.remove();
          this.removeHighlight(error);
        };
        tooltip.appendChild(suggestionBtn);
      });
    }

    // 무시 버튼
    const ignoreBtn = document.createElement('button');
    ignoreBtn.className = 'spell-ignore-btn';
    ignoreBtn.textContent = '×';
    ignoreBtn.onclick = (e) => {
      e.stopPropagation();
      tooltip.remove();
      this.removeHighlight(error);
    };
    tooltip.appendChild(ignoreBtn);

    // 기본 위치 설정
    tooltip.style.position = 'absolute';
    tooltip.style.zIndex = '999999';

    // 문서에 추가 (크기 측정을 위해 먼저 추가)
    document.body.appendChild(tooltip);

    // 위치 계산 및 겹침 방지
    setTimeout(() => {
      const rect = tooltip.getBoundingClientRect();
      // 툴팁을 오류 텍스트 중앙에 맞춤 (툴팁 중앙 = 오류 텍스트 중앙)
      let finalLeft = position.left - (rect.width / 2);
      let finalTop = position.top - rect.height - 8; // 오류 텍스트 바로 위에
      
      // 화면 경계 확인 먼저 (우선순위)
      if (finalTop < 10) {
        // 위쪽 공간이 부족하면 아래쪽에 표시
        finalTop = position.top + 20;
      }
      if (finalLeft < 10) {
        finalLeft = 10;
      }
      if (finalLeft + rect.width > window.innerWidth - 10) {
        finalLeft = window.innerWidth - rect.width - 10;
      }
      
      // 기존 툴팁들과의 겹침 확인 및 조정
      const existingTooltips = document.querySelectorAll('.spell-error-tooltip');
      let attempts = 0;
      const maxAttempts = 8;
      
      while (attempts < maxAttempts) {
        let hasOverlap = false;
        
        for (let existing of existingTooltips) {
          if (existing === tooltip) continue;
          
          const existingRect = existing.getBoundingClientRect();
          
          // 겹침 검사 (8px 여백 포함)
          if (!(finalLeft + rect.width + 8 < existingRect.left ||
                finalLeft - 8 > existingRect.right ||
                finalTop + rect.height + 8 < existingRect.top ||
                finalTop - 8 > existingRect.bottom)) {
            hasOverlap = true;
            
            // 겹치면 세로로 스택
            if (finalTop <= existingRect.top) {
              finalTop = existingRect.top - rect.height - 5;
            } else {
              finalTop = existingRect.bottom + 5;
            }
            
            // 다시 화면 경계 확인
            if (finalTop < 10) {
              finalTop = position.top + 20;
              finalLeft += rect.width + 10; // 옆으로 이동
            }
            if (finalTop + rect.height > window.innerHeight - 10) {
              finalTop = window.innerHeight - rect.height - 10;
            }
          }
        }
        
        if (!hasOverlap) break;
        attempts++;
      }
      
      tooltip.style.left = Math.round(finalLeft) + 'px';
      tooltip.style.top = Math.round(finalTop) + 'px';
      
      // 디버그용 로그
      console.log(`툴팁 중앙 정렬: 오류 중심(${position.left}), 툴팁 위치(${Math.round(finalLeft)}-${Math.round(finalLeft + rect.width)}), 너비(${Math.round(rect.width)})`);
    }, 5);
  }

  calculateTextPosition(element, offset, length) {
    if (element.tagName === 'TEXTAREA') {
      return this.calculateTextareaPosition(element, offset, length);
    }
    return null;
  }

  calculateTextareaPosition(textarea, offset, length) {
    // textarea의 스타일 가져오기
    const computedStyle = window.getComputedStyle(textarea);
    const rect = textarea.getBoundingClientRect();
    
    // 미러 div 생성하여 정확한 텍스트 위치 계산
    const mirror = document.createElement('div');
    mirror.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: ${computedStyle.fontFamily};
      font-size: ${computedStyle.fontSize};
      font-weight: ${computedStyle.fontWeight};
      line-height: ${computedStyle.lineHeight};
      letter-spacing: ${computedStyle.letterSpacing};
      text-decoration: ${computedStyle.textDecoration};
      text-indent: ${computedStyle.textIndent};
      padding: ${computedStyle.paddingTop} ${computedStyle.paddingRight} ${computedStyle.paddingBottom} ${computedStyle.paddingLeft};
      margin: 0;
      border: ${computedStyle.border};
      width: ${textarea.clientWidth}px;
      box-sizing: ${computedStyle.boxSizing};
      overflow: hidden;
      top: -9999px;
    `;
    
    document.body.appendChild(mirror);
    
    // 오류 시작 위치와 끝 위치 계산
    const textBeforeError = textarea.value.substring(0, offset);
    const errorText = textarea.value.substring(offset, offset + length);
    
    // 시작 마커 생성
    const startMarker = document.createElement('span');
    startMarker.textContent = '|';
    
    // 끝 마커 생성
    const endMarker = document.createElement('span');
    endMarker.textContent = '|';
    
    // 미러에 텍스트 구성: 이전텍스트 + |시작| + 오류텍스트 + |끝|
    mirror.innerHTML = '';
    mirror.appendChild(document.createTextNode(textBeforeError));
    mirror.appendChild(startMarker);
    mirror.appendChild(document.createTextNode(errorText));
    mirror.appendChild(endMarker);
    
    const startRect = startMarker.getBoundingClientRect();
    const endRect = endMarker.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    
    document.body.removeChild(mirror);
    
    // 오류 텍스트의 시작과 끝 위치 계산
    const startLeft = startRect.left - mirrorRect.left;
    const endLeft = endRect.left - mirrorRect.left;
    const errorCenterLeft = (startLeft + endLeft) / 2; // 오류 텍스트 중앙
    const errorTop = startRect.top - mirrorRect.top;
    
    // 스크롤 오프셋 적용
    const scrollLeft = textarea.scrollLeft || 0;
    const scrollTop = textarea.scrollTop || 0;
    
    // 최종 위치 계산 (오류 텍스트 중앙 기준)
    const finalLeft = rect.left + errorCenterLeft - scrollLeft + window.scrollX;
    const finalTop = rect.top + errorTop - scrollTop + window.scrollY;
    
    return {
      left: Math.max(0, finalLeft),
      top: Math.max(0, finalTop),
      errorWidth: Math.abs(endLeft - startLeft) // 오류 텍스트 너비 정보도 반환
    };
  }

  highlightErrorText(element, error) {
    // textarea에는 하이라이트 적용 안 함 (불가능)
    // 대신 로그만 출력
    const errorText = this.getErrorText(element, error);
    console.log(`오류 하이라이트: "${errorText}" (${error.offset}:${error.offset + error.length})`);
  }

  removeHighlight(error) {
    // textarea에서는 하이라이트 제거할 것이 없음
    console.log(`하이라이트 제거: ${error.offset}:${error.offset + error.length}`);
  }

  getErrorText(element, error) {
    const text = element.value || element.textContent || '';
    return text.substring(error.offset, error.offset + error.length);
  }

  applySuggestion(error, suggestion) {
    if (this.targetElement) {
      const element = this.targetElement;
      
      // textarea만 처리
      if (element.value !== undefined && element.tagName === 'TEXTAREA') {
        this.applyToTextarea(element, error, suggestion);
        console.log(`"${error.message}" -> "${suggestion}" 적용됨`);
      }
    }
  }

  applyToTextarea(element, error, suggestion) {
    const currentText = element.value || '';
    const beforeError = currentText.substring(0, error.offset);
    const afterError = currentText.substring(error.offset + error.length);
    const newText = beforeError + suggestion + afterError;
    
    // 커서 위치 저장
    const selectionStart = element.selectionStart;
    const selectionEnd = element.selectionEnd;
    
    // 텍스트 교체
    element.value = newText;
    
    // 커서 위치 복원 (수정된 위치 고려)
    const lengthDiff = suggestion.length - error.length;
    let newStart = selectionStart;
    let newEnd = selectionEnd;
    
    if (selectionStart > error.offset) {
      newStart = Math.max(error.offset + suggestion.length, selectionStart + lengthDiff);
    }
    if (selectionEnd > error.offset) {
      newEnd = Math.max(error.offset + suggestion.length, selectionEnd + lengthDiff);
    }
    
    element.setSelectionRange(newStart, newEnd);
    
    // input 이벤트 발생
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  clearErrors() {
    // 모든 오류 UI 제거
    const errorElements = document.querySelectorAll('.spell-error-tooltip');
    errorElements.forEach(element => element.remove());
    
    // 하이라이트 제거
    if (this.targetElement) {
      this.targetElement.style.textDecoration = '';
      this.targetElement.style.textDecorationColor = '';
      this.targetElement.style.textDecorationStyle = '';
    }
  }
}

// 맞춤법 검사기 시작
const spellChecker = new SpellChecker(); 